const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const db = require('../db');

class UserController {
    static async register(req, res) {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                console.error('Username or password missing');
                return res.status(400).json({ error: 'Username and password are required' });
            }
            const userExists = await UserController.findUserByUsername(username);
            if (userExists) {
                console.error(`Username ${username} already exists`);
                return res.status(400).json({ error: 'Username already exists' });
            }
            const hashedPassword = await argon2.hash(password);
            const newUser = { username, password: hashedPassword };
            await UserController.insertUser(newUser);
            res.status(201).json({ message: 'User registered successfully' });
        } catch (error) {
            console.error('Error registering user:', error);
            res.status(500).json({ error: 'Error registering user' });
        }
    }

    static async login(req, res) {
        try {
            const { username, password } = req.body;
            const user = await UserController.findUserByUsername(username);
            if (!user) {
                return res.status(400).json({ error: 'Invalid username or password' });
            }
            const validPassword = await argon2.verify(user.password, password);
            if (!validPassword) {
                return res.status(400).json({ error: 'Invalid username or password' });
            }
            console.log('User logged in:', user.username);
            const token = await UserController.createToken(user.username);

            res.status(200).json({ jwt: token });
        } catch (error) {
            res.status(500).json({ error: 'Error logging in user' });
        }
    }

    static async createToken(user){
        return jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: '24h' });
    }

    static async verifyToken(token){
        return jwt.verify(token, process.env.JWT_SECRET);
    }
    
    static async insertUser(user) {
        try {
            const result = await db.query(
                'INSERT INTO naudotojas (el_pastas, slaptazodis) VALUES ($1, $2) RETURNING *',
                [user.username, user.password]
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
}

module.exports = UserController;