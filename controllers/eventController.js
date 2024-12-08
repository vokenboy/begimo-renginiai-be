const db = require('../db');
const jwt = require('jsonwebtoken');

class EventController {
    static async getPublicEvents(req, res) {
        try {
            const publicEvents = await db.query('SELECT * FROM renginys WHERE privatus = false');
            res.status(200).json(publicEvents.rows);
        } catch (error) {
            console.error('Klaida gaunant viešus renginius:', error);
            res.status(500).json({ error: 'Serverio klaida' });
        }
    }

    static async getPrivateEvents(req, res) {
        try {
            const privateEvents = await db.query('SELECT * FROM renginys WHERE privatus = true');
            res.status(200).json(privateEvents.rows);
        } catch (error) {
            console.error('Klaida gaunant privačius renginius:', error);
            res.status(500).json({ error: 'Serverio klaida' });
        }
    }

    static async getEventById(req, res) {
        const { id } = req.params;
    
        if (!Number.isInteger(Number(id))) {
            console.error(`Invalid ID: ${id}`);
            return res.status(400).json({ error: 'Invalid ID format' });
        }
    
        try {
            const event = await db.query('SELECT * FROM renginys WHERE id = $1', [id]);
            if (!event.rows.length) {
                return res.status(404).json({ error: 'Renginys nerastas' });
            }
            res.status(200).json(event.rows[0]);
        } catch (error) {
            console.error('Klaida gaunant renginį:', error);
            res.status(500).json({ error: 'Serverio klaida' });
        }
    }
    

    static async createEvent(req, res) {
        try {
            const {
                pavadinimas,
                aprasymas,
                data,
                pradzios_laikas,
                pabaigos_laikas,
                internetinio_puslapio_nuoroda,
                facebook_nuoroda,
                sukurimo_data,
                adresas,
                privatus,
                nuotrauka,
                koordinate,
                miestas_id,
            } = req.body;

            if (!pavadinimas || !data || !pradzios_laikas || !miestas_id) {
                return res.status(400).json({ error: 'Pavadinimas, data, pradžios laikas ir miesto ID yra privalomi' });
            }

            const result = await db.query(
                `INSERT INTO renginys (pavadinimas, aprasymas, data, pradzios_laikas, pabaigos_laikas, internetinio_puslapio_nuoroda, facebook_nuoroda, sukurimo_data, adresas, privatus, nuotrauka, koordinate, miestas_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
                [
                    pavadinimas,
                    aprasymas,
                    data,
                    pradzios_laikas,
                    pabaigos_laikas,
                    internetinio_puslapio_nuoroda,
                    facebook_nuoroda,
                    sukurimo_data || new Date(),
                    adresas,
                    privatus || false,
                    nuotrauka,
                    koordinate,
                    miestas_id,
                ]
            );

            res.status(201).json({ message: 'Renginys sukurtas sėkmingai', renginys: result.rows[0] });
        } catch (error) {
            console.error('Klaida kuriant renginį:', error);
            res.status(500).json({ error: 'Serverio klaida' });
        }
    }

    static async updateEvent(req, res) {
        const { id } = req.params;
        try {
            const {
                pavadinimas,
                aprasymas,
                data,
                pradzios_laikas,
                pabaigos_laikas,
                internetinio_puslapio_nuoroda,
                facebook_nuoroda,
                adresas,
                privatus,
                nuotrauka,
                koordinate,
                miestas_id,
            } = req.body;
    
            if (!pavadinimas || !data || !pradzios_laikas || !miestas_id) {
                return res.status(400).json({
                    error: 'Pavadinimas, data, pradžios laikas ir miesto ID yra privalomi',
                });
            }
    
            const formattedDate = new Date(data).toISOString().split('T')[0];
    
            const result = await db.query(
                `UPDATE renginys
                 SET pavadinimas = $1, aprasymas = $2, data = $3, pradzios_laikas = $4, pabaigos_laikas = $5,
                     internetinio_puslapio_nuoroda = $6, facebook_nuoroda = $7, adresas = $8, privatus = $9,
                     nuotrauka = $10, koordinate = $11, miestas_id = $12
                 WHERE id = $13 RETURNING *`,
                [
                    pavadinimas,
                    aprasymas,
                    formattedDate,
                    pradzios_laikas,
                    pabaigos_laikas,
                    internetinio_puslapio_nuoroda,
                    facebook_nuoroda,
                    adresas,
                    privatus,
                    nuotrauka,
                    koordinate,
                    miestas_id,
                    id,
                ]
            );
    
            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Renginys nerastas' });
            }
    
            res.status(200).json({ message: 'Renginys atnaujintas sėkmingai', renginys: result.rows[0] });
        } catch (error) {
            console.error('Klaida atnaujinant renginį:', error);
            res.status(500).json({ error: 'Serverio klaida' });
        }
    }
    
    

    static async deleteEventById(req, res) {
        const { id } = req.params;
        console.log(`Received request to delete event with ID: ${id}`);
        
        try {
            const event = await db.query('SELECT * FROM renginys WHERE id = $1', [id]);
            if (!event.rows.length) {
                console.error(`Event with ID: ${id} not found`);
                return res.status(404).json({ error: 'Renginys nerastas' });
            }
    
            await db.query('DELETE FROM renginys WHERE id = $1', [id]);
            console.log(`Event with ID: ${id} deleted successfully`);
            res.status(200).json({ message: 'Renginys sėkmingai ištrintas' });
        } catch (error) {
            console.error('Error during event deletion:', error.message);
            res.status(500).json({ error: 'Serverio klaida' });
        }
    }

    static async getAllCities(req, res) {
        try {
            console.log('Fetching cities from the database...');
            const cities = await db.query('SELECT id, pavadinimas FROM miestas');
            console.log('Cities fetched successfully:', cities.rows);
            res.status(200).json(cities.rows);
        } catch (error) {
            console.error('Klaida gaunant miestus:', error.message);
            res.status(500).json({ error: 'Serverio klaida' });
        }
    }
}

module.exports = EventController;
