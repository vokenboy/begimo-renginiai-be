const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const db = require('../db');

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
            const user = await UserController.findUserByUsername(username);
            if (!user) {
                return res.status(400).json({ error: 'Neteisingi prisijungimo duomenys' });
            }
            const validPassword = await argon2.verify(user.password, password);
            if (!validPassword) {
                return res.status(400).json({ error: 'Neteisingi prisijungimo duomenys' });
            }
            const token = await UserController.createToken({id: user.id, username: user.username});

            res.status(200).json({ jwt: token, userid:user.id });
        } catch (error) {
            res.status(500).json({ error: 'Nepavyko prijungti naudotojo' });
        }
    }

    static async createToken(user){
        return jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: '24h' });
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

    static async findUserByUsername(username){
        try {
            const user = await db.query('SELECT id, el_pastas as username, slaptazodis as password FROM naudotojas WHERE el_pastas = $1', [username]);
            return user.rows[0];
        } catch (error) {
            console.error('Error finding user by username:', error);
            throw error;
        }
    }

    static async findUserById(id){
        try {
            const user = await db.query('SELECT * FROM naudotojas WHERE id = $1', [id]);
            return user.rows[0];
        } catch (error) {
            console.error('Error finding user by id:', error);
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
            if (!username || username.id !== user.id){  
                delete user.telefono_numeris;
                delete user.el_pastas;
            }
            res.status(200).json(user);
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
            if (!username || username.id !== parseInt(req.params.userid)){
                return res.status(403).json({ error: 'Neleidžiama redaguoti šio naudotojo' });
            }
            const user = await UserController.findUserById(req.params.userid);
            if (!user) {
                return res.status(404).json({ error: 'Naudotojas nerastas' });
            }
            const { vardas, pavarde, telefono_numeris, slapyvardis, el_pastas, profilio_nuotrauka, facebook_nuoroda, instagram_nuoroda, twitter_nuoroda, aprasymas, gimimo_data, lytis } = req.body;
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
                lytis: lytis
            };
            await db.query(
                'UPDATE naudotojas SET vardas = $1, pavarde = $2, telefono_numeris = $3, el_pastas = $4, profilio_nuotrauka = $5, facebook_nuoroda = $6, instagram_nuoroda = $7, twitter_nuoroda = $8, aprasymas = $9, gimimo_data = $10, lytis = $11, slapyvardis = $12 WHERE id = $13',
                [updatedUser.vardas, updatedUser.pavarde, updatedUser.telefono_numeris, updatedUser.el_pastas, updatedUser.profilio_nuotrauka, updatedUser.facebook_nuoroda, updatedUser.instagram_nuoroda, updatedUser.twitter_nuoroda, updatedUser.aprasymas, updatedUser.gimimo_data, updatedUser.lytis, updatedUser.slapyvardis, updatedUser.id]
            );
            res.status(200).json({ message: 'Naudotojo duomenys atnaujinti' });
        } catch (error) {
            res.status(500).json({ error: 'Serverio klaida' });
        }
    }
}

module.exports = UserController;