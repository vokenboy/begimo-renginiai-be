const db = require('../db'); // Database connection
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

    // Fetch an event by ID
    static async getEventById(req, res) {
        const { id } = req.params;
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

    // Create a new event
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

    // Update an event by ID
    static async updateEventById(req, res) {
        const { eventid } = req.params;
        try {
            const event = await db.query('SELECT * FROM renginys WHERE id = $1', [eventid]);
            if (!event.rows.length) {
                return res.status(404).json({ error: 'Renginys nerastas' });
            }

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
            } = req.body;

            await db.query(
                `UPDATE renginys
                 SET pavadinimas = $1, aprasymas = $2, data = $3, pradzios_laikas = $4, pabaigos_laikas = $5, 
                     internetinio_puslapio_nuoroda = $6, facebook_nuoroda = $7, adresas = $8, privatus = $9, 
                     nuotrauka = $10, koordinate = $11
                 WHERE id = $12`,
                [
                    pavadinimas || event.rows[0].pavadinimas,
                    aprasymas || event.rows[0].aprasymas,
                    data || event.rows[0].data,
                    pradzios_laikas || event.rows[0].pradzios_laikas,
                    pabaigos_laikas || event.rows[0].pabaigos_laikas,
                    internetinio_puslapio_nuoroda || event.rows[0].internetinio_puslapio_nuoroda,
                    facebook_nuoroda || event.rows[0].facebook_nuoroda,
                    adresas || event.rows[0].adresas,
                    privatus !== undefined ? privatus : event.rows[0].privatus,
                    nuotrauka || event.rows[0].nuotrauka,
                    koordinate || event.rows[0].koordinate,
                    eventid,
                ]
            );

            res.status(200).json({ message: 'Renginys atnaujintas sėkmingai' });
        } catch (error) {
            console.error('Klaida atnaujinant renginį:', error);
            res.status(500).json({ error: 'Serverio klaida' });
        }
    }

    // Delete an event by ID
    static async deleteEventById(req, res) {
        const { id } = req.params;
    try {
        const event = await db.query('SELECT * FROM renginys WHERE id = $1', [id]);
        if (!event.rows.length) {
            return res.status(404).json({ error: 'Renginys nerastas' });
        }

        await db.query('DELETE FROM renginys WHERE id = $1', [id]);
        res.status(200).json({ message: 'Renginys sėkmingai ištrintas' });
    } catch (error) {
        console.error('Klaida trinant renginį:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
    }

    static async getAllCities(req, res) {
        try {
            const cities = await db.query('SELECT id, pavadinimas FROM miestas');
            res.status(200).json(cities.rows);
        } catch (error) {
            console.error('Klaida gaunant miestus:', error);
            res.status(500).json({ error: 'Serverio klaida' });
        }
    }
}

module.exports = EventController;
