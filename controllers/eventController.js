const db = require('../db');
const jwt = require('jsonwebtoken');
const axios = require('axios');

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
<<<<<<< HEAD
=======
        console.log('[DEBUG] Fetching event with ID:', id);
    
>>>>>>> 1e057949b2ab99eec3b7b73a05827d54424b6c78
        if (!Number.isInteger(Number(id))) {
            console.error('[ERROR] Invalid ID format:', id);
            return res.status(400).json({ error: 'Invalid ID format' });
        }
    
        try {
            const event = await db.query(`
                SELECT 
                    renginys.*, 
<<<<<<< HEAD
                    miestas.pavadinimas AS miestas_pavadinimas
                FROM renginys
                LEFT JOIN miestas ON renginys.miestas_id = miestas.id
                WHERE renginys.id = $1
            `, [id]);

=======
                    miestas.pavadinimas AS miestas_pavadinimas,
                    distancija.pavadinimas AS distancija_pavadinimas,
                    distancija.atstumas AS distancija_atstumas,
                    renginys.organizatorius_id
                FROM renginys
                LEFT JOIN miestas ON renginys.miestas_id = miestas.id
                LEFT JOIN distancija ON renginys.distancija_id = distancija.id
                WHERE renginys.id = $1
            `, [id]);
    
            console.log('[DEBUG] Event fetched:', event.rows);
    
>>>>>>> 1e057949b2ab99eec3b7b73a05827d54424b6c78
            if (!event.rows.length) {
                console.warn('[WARN] Event not found with ID:', id);
                return res.status(404).json({ error: 'Renginys nerastas' });
            }
    
            res.status(200).json(event.rows[0]);
        } catch (error) {
            console.error('[ERROR] Fetching event failed:', error);
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
                adresas,
                privatus,
                nuotrauka,
                koordinate,
                miestas_id,
                distancija_id,
                organizatorius_id,
            } = req.body;

            if (!pavadinimas || !data || !pradzios_laikas || !miestas_id || !distancija_id || !organizatorius_id) {
                return res.status(400).json({
                    error: 'Pavadinimas, data, pradžios laikas, miesto ID, distancijos ID ir organizatoriaus ID yra privalomi',
                });
            }

            const result = await db.query(
                `INSERT INTO renginys (
                    pavadinimas, aprasymas, data, pradzios_laikas, pabaigos_laikas,
                    internetinio_puslapio_nuoroda, facebook_nuoroda, adresas, privatus,
                    nuotrauka, koordinate, miestas_id, distancija_id, organizatorius_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *`,
                [
                    pavadinimas,
                    aprasymas,
                    data,
                    pradzios_laikas,
                    pabaigos_laikas,
                    internetinio_puslapio_nuoroda,
                    facebook_nuoroda,
                    adresas,
                    privatus || false,
                    nuotrauka,
                    koordinate,
                    miestas_id,
                    distancija_id,
                    organizatorius_id,
                ]
            );

            res.status(201).json({ message: 'Renginys sukurtas sėkmingai', renginys: result.rows[0] });
        } catch (error) {
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
                distancija_id,
            } = req.body;
    
            if (!pavadinimas || !data || !pradzios_laikas || !miestas_id || !distancija_id) {
                return res.status(400).json({
                    error: 'Pavadinimas, data, pradžios laikas, miesto ID ir distancijos ID yra privalomi',
                });
            }
    
            const formattedDate = new Date(data).toISOString().split('T')[0];
    
            const result = await db.query(
                `UPDATE renginys
                 SET pavadinimas = $1, aprasymas = $2, data = $3, pradzios_laikas = $4, pabaigos_laikas = $5,
                     internetinio_puslapio_nuoroda = $6, facebook_nuoroda = $7, adresas = $8, privatus = $9,
                     nuotrauka = $10, koordinate = $11, miestas_id = $12, distancija_id = $13
                 WHERE id = $14 RETURNING *`,
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
                    distancija_id,
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
    
            await db.query('DELETE FROM pakvietimas WHERE renginio_id = $1', [id]);
    
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

    static async getWeatherByEvent(req, res) {
        const { id } = req.params;
    
        try {
            const event = await db.query(`
                SELECT 
                    renginys.pavadinimas, 
                    renginys.data, 
                    renginys.pradzios_laikas, 
                    renginys.koordinate
                FROM renginys
                WHERE renginys.id = $1
            `, [id]);
    
            if (!event.rows.length) {
                return res.status(404).json({ error: 'Renginys nerastas' });
            }
    
            const eventDetails = event.rows[0];
    
            const [latitude, longitude] = eventDetails.koordinate.split(',').map(coord => parseFloat(coord.trim()));
    
            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({ error: 'Invalid coordinates format' });
            }
    
            const eventDate = new Date(eventDetails.data).toISOString().split('T')[0];
    
            const weatherResponse = await axios.get('https://api.open-meteo.com/v1/forecast', {
                params: {
                    latitude,
                    longitude,
                    start_date: eventDate,
                    end_date: eventDate,
                    hourly: 'temperature_2m,precipitation,wind_speed_10m',
                }
            });

            res.status(200).json({
                event: {
                    pavadinimas: eventDetails.pavadinimas,
                    data: eventDetails.data,
                    pradzios_laikas: eventDetails.pradzios_laikas,
                    koordinate: eventDetails.koordinate,
                },
                weather: weatherResponse.data
            });
        } catch (error) {
            console.error('Klaida gaunant orų prognozę:', error.message);
    
            if (error.response) {
                return res.status(error.response.status).json({
                    error: `Weather API error: ${error.response.data}`,
                });
            }
    
            res.status(500).json({ error: 'Serverio klaida' });
        }
    }
<<<<<<< HEAD
=======

    static async getDistances(req, res) {
        try {
            const distances = await db.query('SELECT id, atstumas, pavadinimas FROM distancija');
            res.status(200).json(distances.rows);
        } catch (error) {
            console.error('Klaida gaunant distancijas:', error);
            res.status(500).json({ error: 'Serverio klaida' });
        }
    }
    
>>>>>>> 1e057949b2ab99eec3b7b73a05827d54424b6c78
}

module.exports = EventController;
