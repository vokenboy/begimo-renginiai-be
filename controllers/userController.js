const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const db = require('../db');
const EmailController = require('./emailController');
const crypto = require('crypto');

class UserController {
	static async register(req, res) {
		try {
			const { username, password, email } = req.body;
			if (!email || !username || !password) {
				return res.status(400).json({ error: 'Visi laukai yra privalomi' });
			}
			const userExists = await UserController.findUserByUsername(email);
			if (userExists) {
				return res.status(400).json({ error: 'El. pašto adresas jau naudojamas' });
			}
			const hashedPassword = await argon2.hash(password);
			const newUser = { username, email, password: hashedPassword };
			await UserController.insertUser(newUser);
			res.status(201).json({ message: 'Naudotojas priregistruotas sėkmingai' });
		} catch (error) {
			console.error('Error updating user:', error);
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}

	static async login(req, res) {
		try {
			const { username, password } = req.body;
			let user = await UserController.findUserByUsername(username);
			if (!user) {
				return res.status(400).json({ error: 'Neteisingi prisijungimo duomenys' });
			}
			const validPassword = await argon2.verify(user.password, password);
			if (!validPassword) {
				return res.status(400).json({ error: 'Neteisingi prisijungimo duomenys' });
			}
			delete user.slaptazodis;
			const token = await UserController.createToken({ id: user.id, username: user.username });

			delete user.password;

			res.status(200).json({ jwt: token, userid: user.id, user });
		} catch (error) {
			res.status(500).json({ error: 'Nepavyko prijungti naudotojo' });
		}
	}

	static async createToken(user) {
		return jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: '24h' });
	}

	static async createRecoveryString() {
		const recoveryString = crypto.randomBytes(32).toString('hex');
		return recoveryString;
	}

	static async verifyToken(token) {
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			return decoded.user;
		} catch (error) {
			throw new Error('Invalid token');
		}
	}

	static async insertUser(user) {
		try {
			const result = await db.query(
				'INSERT INTO naudotojas (el_pastas, slapyvardis, slaptazodis) VALUES ($1, $2, $3) RETURNING *',
				[user.email, user.username, user.password]
			);
			return result.rows[0];
		} catch (error) {
			console.error('Error inserting user:', error);
			throw error;
		}
	}

	static async findUserByUsername(username) {
		try {
			const user = await db.query(
				`SELECT 
                        naudotojas.id, 
                        el_pastas AS username, 
                        slaptazodis AS password, 
                        COALESCE(teises.nustatymu_redagavimas, FALSE) AS nustatymu_redagavimas,
                        COALESCE(teises.turinio_redagavimas, FALSE) AS turinio_redagavimas
                        FROM naudotojas
                        LEFT JOIN teises ON teises.naudotojas_id = naudotojas.id
                        WHERE el_pastas = $1;
                        `,
				[username]
			);
			console.log(user.rows[0]);
			return user.rows[0];
		} catch (error) {
			console.error('Error finding user by username:', error);
			throw error;
		}
	}

	static async findUserByEmail(email) {
		try {
			const user = await db.query(
				'SELECT id, el_pastas as username, slaptazodis as password FROM naudotojas WHERE el_pastas = $1',
				[email]
			);
			return user.rows[0];
		} catch (error) {
			console.error('Error finding user by email:', error);
			throw error;
		}
	}

	static async findUserById(id) {
		try {
			const user = await db.query('SELECT * FROM naudotojas WHERE id = $1', [id]);
			return user.rows[0];
		} catch (error) {
			console.error('Error finding user by id:', error);
			throw error;
		}
	}

	static async createUserPasswordReset(id, code) {
		try {
			await db.query('INSERT INTO slaptazodzio_pakeitimo_uzklausos (naudotojas_id, kodas, used) VALUES ($1, $2, $3)', [
				id,
				code,
				false,
			]);
		} catch (error) {
			console.error('Error creating password reset:', error);
			throw error;
		}
	}

	static async getUserById(req, res) {
		try {
			if (!req.headers.authorization) {
				return res.status(401).json({ error: 'Neautorizuota' });
			}
			if (!req.params.userid) {
				return res.status(400).json({ error: 'Naudotojo ID laukas yra būtinas' });
			}
			const token = req.headers.authorization.split(' ')[1];
			const username = await UserController.verifyToken(token);
			const user = await UserController.findUserById(req.params.userid);
			if (!user) {
				return res.status(404).json({ error: 'Naudotojas nerastas' });
			}
			delete user.slaptazodis;
			if (!username || username.id !== user.id) {
				delete user.telefono_numeris;
			}
			res.status(200).json(user);
		} catch (error) {
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}

	static async getUserByEmail(req, res) {
		try {
			// if (!req.headers.authorization) {
			// 	return res.status(401).json({ error: 'Neautorizuota' });
			// }
			if (!req.params.email) {
				return res.status(400).json({ error: 'Naudotojo email laukas yra būtinas' });
			}
			// const token = req.headers.authorization.split(' ')[1];
			// const username = await UserController.verifyToken(token);
			const user = await UserController.findUserByEmail(req.params.email);
			if (!user) {
				return res.status(404).json({ error: 'Naudotojas nerastas' });
			}
			delete user.slaptazodis;

			res.status(200).json(user);
		} catch (error) {
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}

	static async changePassword(req, res) {
		try {
			console.log(req.body);
			if (!req.body.code || !req.body.password || !req.body.email) {
				return res.status(401).json({ error: 'Nepateikti visi duomenų laukai' });
			}
			const user = await db.query(
				`SELECT naudotojas.id from naudotojas
                            INNER JOIN slaptazodzio_pakeitimo_uzklausos ON naudotojas.id = slaptazodzio_pakeitimo_uzklausos.naudotojas_id
                            WHERE slaptazodzio_pakeitimo_uzklausos.kodas = $1
                            AND naudotojas.el_pastas = $2 AND slaptazodzio_pakeitimo_uzklausos.used = false`,
				[req.body.code, req.body.email]
			);
			if (!user.rows[0]) {
				return res.status(404).json({ error: 'Neteisingi duomenys' });
			}

			console.log(user.rows[0]);

			const hashedPassword = await argon2.hash(req.body.password);
			await db.query('UPDATE naudotojas SET slaptazodis = $1 WHERE id = $2', [hashedPassword, user.rows[0].id]);
			await db.query('UPDATE slaptazodzio_pakeitimo_uzklausos SET used = true WHERE naudotojas_id = $1', [
				user.rows[0].id,
			]);
			res.status(200).json({ message: 'Slaptažodis pakeistas' });
		} catch (error) {
			console.error('Error changing password:', error);
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}

	static async updateUser(req, res) {
		try {
			if (!req.headers.authorization) {
				return res.status(401).json({ error: 'Neautorizuota' });
			}
			if (!req.params.userid) {
				return res.status(400).json({ error: 'Naudotojo ID laukas yra būtinas' });
			}
			const token = req.headers.authorization.split(' ')[1];
			const username = await UserController.verifyToken(token);
			if (!username || username.id !== parseInt(req.params.userid)) {
				return res.status(403).json({ error: 'Neleidžiama redaguoti šio naudotojo' });
			}
			const user = await UserController.findUserById(req.params.userid);
			if (!user) {
				return res.status(404).json({ error: 'Naudotojas nerastas' });
			}
			const {
				vardas,
				pavarde,
				telefono_numeris,
				slapyvardis,
				el_pastas,
				profilio_nuotrauka,
				facebook_nuoroda,
				instagram_nuoroda,
				twitter_nuoroda,
				aprasymas,
				gimimo_data,
				lytis,
			} = req.body;
			const updatedUser = {
				id: user.id,
				vardas: vardas,
				pavarde: pavarde,
				telefono_numeris: telefono_numeris,
				slapyvardis: slapyvardis,
				el_pastas: el_pastas,
				profilio_nuotrauka: profilio_nuotrauka,
				facebook_nuoroda: facebook_nuoroda,
				instagram_nuoroda: instagram_nuoroda,
				twitter_nuoroda: twitter_nuoroda,
				aprasymas: aprasymas,
				gimimo_data: gimimo_data,
				lytis: lytis,
			};
			await db.query(
				'UPDATE naudotojas SET vardas = $1, pavarde = $2, telefono_numeris = $3, el_pastas = $4, profilio_nuotrauka = $5, facebook_nuoroda = $6, instagram_nuoroda = $7, twitter_nuoroda = $8, aprasymas = $9, gimimo_data = $10, lytis = $11, slapyvardis = $12 WHERE id = $13',
				[
					updatedUser.vardas,
					updatedUser.pavarde,
					updatedUser.telefono_numeris,
					updatedUser.el_pastas,
					updatedUser.profilio_nuotrauka,
					updatedUser.facebook_nuoroda,
					updatedUser.instagram_nuoroda,
					updatedUser.twitter_nuoroda,
					updatedUser.aprasymas,
					updatedUser.gimimo_data,
					updatedUser.lytis,
					updatedUser.slapyvardis,
					updatedUser.id,
				]
			);
			res.status(200).json({ message: 'Naudotojo duomenys atnaujinti' });
		} catch (error) {
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}
	static async recoverPassword(req, res) {
		if (!req.body.email) {
			return res.status(400).json({ error: 'El. pašto adresas yra privalomas' });
		}
		try {
			const code = await UserController.createRecoveryString();
			console.log(req.body.email);
			const user = await UserController.findUserByEmail(req.body.email);
			if (!user) {
				throw new Error('User not found');
			}
			console.log(user);
			await UserController.createUserPasswordReset(user.id, code);
			await EmailController.sendPasswordRecoveryEmail(user.slapyvardis, req.body.email, code);
		} catch (error) {
			console.error('Error recovering password:', error);
			res.status(200).json({ message: 'Recovery email sent' });
		}
		res.status(200).json({ message: 'Recovery email sent' });
	}

	static async getUserRunningStatistics(req, res) {
		try {
			if (!req.params.userid) {
				return res.status(400).json({ error: 'Naudotojo ID laukas yra būtinas' });
			}
			const statistics = await db.query(
				`
                SELECT 
                    COUNT(*) AS total_runs,
                    SUM(nubėgtas_atstumas) AS total_distance,
                    SUM(EXTRACT(EPOCH FROM laikas)) AS total_time_seconds,
                    AVG(tempas) AS average_pace
                FROM 
                    begimo_rezultatas
                WHERE 
                    naudotojas_id = $1
            `,
				[req.params.userid]
			);
			res.status(200).json(statistics.rows);
		} catch (error) {
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}

	static async updateUser(req, res) {
		try {
			if (!req.headers.authorization) {
				return res.status(401).json({ error: 'Neautorizuota' });
			}
			if (!req.params.userid) {
				return res.status(400).json({ error: 'Naudotojo ID laukas yra būtinas' });
			}
			const token = req.headers.authorization.split(' ')[1];
			const username = await UserController.verifyToken(token);
			if (!username || username.id !== parseInt(req.params.userid)) {
				return res.status(403).json({ error: 'Neleidžiama redaguoti šio naudotojo' });
			}
			const user = await UserController.findUserById(req.params.userid);
			if (!user) {
				return res.status(404).json({ error: 'Naudotojas nerastas' });
			}
			const {
				vardas,
				pavarde,
				telefono_numeris,
				slapyvardis,
				el_pastas,
				profilio_nuotrauka,
				facebook_nuoroda,
				instagram_nuoroda,
				twitter_nuoroda,
				aprasymas,
				gimimo_data,
				lytis,
			} = req.body;
			const updatedUser = {
				id: user.id,
				vardas: vardas,
				pavarde: pavarde,
				telefono_numeris: telefono_numeris,
				slapyvardis: slapyvardis,
				el_pastas: el_pastas,
				profilio_nuotrauka: profilio_nuotrauka,
				facebook_nuoroda: facebook_nuoroda,
				instagram_nuoroda: instagram_nuoroda,
				twitter_nuoroda: twitter_nuoroda,
				aprasymas: aprasymas,
				gimimo_data: gimimo_data,
				lytis: lytis,
			};
			await db.query(
				'UPDATE naudotojas SET vardas = $1, pavarde = $2, telefono_numeris = $3, el_pastas = $4, profilio_nuotrauka = $5, facebook_nuoroda = $6, instagram_nuoroda = $7, twitter_nuoroda = $8, aprasymas = $9, gimimo_data = $10, lytis = $11, slapyvardis = $12 WHERE id = $13',
				[
					updatedUser.vardas,
					updatedUser.pavarde,
					updatedUser.telefono_numeris,
					updatedUser.el_pastas,
					updatedUser.profilio_nuotrauka,
					updatedUser.facebook_nuoroda,
					updatedUser.instagram_nuoroda,
					updatedUser.twitter_nuoroda,
					updatedUser.aprasymas,
					updatedUser.gimimo_data,
					updatedUser.lytis,
					updatedUser.slapyvardis,
					updatedUser.id,
				]
			);
			res.status(200).json({ message: 'Naudotojo duomenys atnaujinti' });
		} catch (error) {
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}
	static async recoverPassword(req, res) {
		if (!req.body.email) {
			return res.status(400).json({ error: 'El. pašto adresas yra privalomas' });
		}
		try {
			const code = await UserController.createRecoveryString();
			console.log(req.body.email);
			const user = await UserController.findUserByEmail(req.body.email);
			if (!user) {
				throw new Error('User not found');
			}
			console.log(user);
			await UserController.createUserPasswordReset(user.id, code);
			await EmailController.sendPasswordRecoveryEmail(user.slapyvardis, req.body.email, code);
		} catch (error) {
			console.error('Error recovering password:', error);
			res.status(200).json({ message: 'Recovery email sent' });
		}
		res.status(200).json({ message: 'Recovery email sent' });
	}

	static async isUserOrganizer(userId) {
		try {
			const result = await db.query(
				'SELECT id FROM organizatorius WHERE id = $1',
				[userId]
			);
	
			return result.rows.length > 0;
		} catch (error) {
			console.error('Error checking if user is an organizer:', error);
			throw new Error('Server error while checking organizer status');
		}
	}

	static async isAdmin(userId) {
        try {
            const result = await db.query(
                'SELECT id FROM administratorius WHERE id = $1',
                [userId]
            );

            return result.rows.length > 0;
        } catch (error) {
            console.error('[ERROR] Checking admin status failed:', error);
            throw new Error('Server error while checking admin status');
        }
    }
}

module.exports = UserController;
