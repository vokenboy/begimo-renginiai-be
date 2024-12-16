const db = require('../db'); // Assume you have a database connection set up
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const EmailController = require('./emailController');

class RegistrationController {
	// Function to fetch all registrations for a specific event or all events
	static async getRegistrations(req, res) {
		try {
			const { id } = req.params; // Get event ID from request parameters
			const query = 'SELECT * FROM registracijos WHERE renginio_id = $1'; // Parameterized query

			// Pass the ID as a parameter to the query
			const result = await db.query(query, id ? [id] : []);

			// Return the result rows as JSON
			res.status(200).json(result.rows);
		} catch (error) {
			console.error('Error fetching registrations:', error);
			res.status(500).json({ message: 'Failed to fetch registrations' });
		}
	}

	// Function to register a user for an event
	static async registerUser(req, res) {
		try {
			const { naudotojo_id, renginio_id, send_reminders } = req.body;

			// Validate inputs
			if (!naudotojo_id || !renginio_id) {
				return res.status(400).json({ message: 'User ID and Event ID are required' });
			}

			// Get user details
			const userQuery = 'SELECT vardas, el_pastas FROM naudotojas WHERE id = $1';
			const userResult = await db.query(userQuery, [naudotojo_id]);

			if (userResult.rows.length === 0) {
				return res.status(404).json({ message: 'User not found' });
			}

			const { vardas, el_pastas } = userResult.rows[0];

			// Insert registration
			const query = `
            INSERT INTO registracijos (vardas, el_pastas, registracijos_data, renginio_id, naudotojo_id, send_reminders)
            VALUES ($1, $2, NOW(), $3, $4, $5) RETURNING *;
        `;
			const result = await db.query(query, [
				vardas,
				el_pastas,
				parseInt(renginio_id),
				parseInt(naudotojo_id),
				send_reminders,
			]);

			if (send_reminders) {
				await this.addEventToGoogleCalendar(naudotojo_id, renginio_id, vardas, el_pastas);

				const renginysQuery = `SELECT * FROM reginys WHERE id = $1`;
				const renginys = await db.query(renginysQuery, [renginio_id]);

				EmailController.scheduleEmail(
					vardas,
					el_pastas,
					`http://localhost:3000/register-event/${renginio_id}`,
					Date(renginys.data) - 60000 * 60 * 24 //Išsiunčia 24h iki renginio
				);
			}

			res.status(201).json({
				message: 'Naudotojas sėkmingai užsiregistravo',
				registration: result.rows[0],
			});
		} catch (error) {
			console.error('Error registering user:', error);
			res.status(500).json({ message: 'Failed to register user' });
		}
	}

	// Function to delete a specific registration
	static async deleteRegistration(req, res) {
		const { registrationId } = req.params;
		const { userId } = req.body;

		try {
			const query = 'DELETE FROM registracijos WHERE id = $1 AND naudotojo_id = $2 RETURNING *;';
			const result = await db.query(query, [registrationId, userId]);

			if (result.rows.length === 0) {
				return res.status(404).json({ message: 'Registration not found or unauthorized' });
			}

			res.status(200).json({ message: 'Registration deleted successfully' });
		} catch (error) {
			console.error('Error deleting registration:', error);
			res.status(500).json({ message: 'Failed to delete registration' });
		}
	}
	// Update registration
	static async updateRegistration(req, res) {
		try {
			const { naudotojo_id, renginio_id, send_reminders } = req.body;

			if (!naudotojo_id || !renginio_id) {
				return res.status(400).json({ message: 'User ID and Event ID are required' });
			}

			const checkQuery = `
            SELECT * FROM registracijos
            WHERE naudotojo_id = $1 AND renginio_id = $2;
        `;
			const checkResult = await db.query(checkQuery, [naudotojo_id, renginio_id]);

			if (checkResult.rows.length > 0) {
				const updateQuery = `
                UPDATE registracijos
                SET send_reminders = $1, registracijos_data = NOW()
                WHERE naudotojo_id = $2 AND renginio_id = $3
                RETURNING *;
            `;
				const updateResult = await db.query(updateQuery, [send_reminders, naudotojo_id, renginio_id]);
				return res.status(200).json({
					message: 'Registration updated successfully',
					registration: updateResult.rows[0],
				});
			} else {
				const userQuery = 'SELECT vardas, el_pastas FROM naudotojas WHERE id = $1';
				const userResult = await db.query(userQuery, [naudotojo_id]);

				if (userResult.rows.length === 0) {
					return res.status(404).json({ message: 'User not found' });
				}

				const { vardas, el_pastas } = userResult.rows[0];

				const insertQuery = `
                INSERT INTO registracijos (vardas, el_pastas, registracijos_data, renginio_id, naudotojo_id, send_reminders)
                VALUES ($1, $2, NOW(), $3, $4, $5) RETURNING *;
            `;
				const insertResult = await db.query(insertQuery, [
					vardas,
					el_pastas,
					renginio_id,
					naudotojo_id,
					send_reminders,
				]);

				return res.status(201).json({
					message: 'New registration created successfully',
					registration: insertResult.rows[0],
				});
			}
		} catch (error) {
			console.error('Error updating registration:', error);
			res.status(500).json({ message: 'Failed to update registration' });
		}
	}

	static async addEventToGoogleCalendar(eventId, email) {
		try {
			// Fetch event details (you can modify this query based on your database schema)
			const eventQuery = 'SELECT * FROM renginys WHERE id = $1';
			const eventResult = await db.query(eventQuery, [eventId]);

			if (eventResult.rows.length === 0) {
				throw new Error('Event not found');
			}

			const { pavadinimas, data, pradzios_laikas, pabaigos_laikas, adresas, aprasymas } = eventResult.rows[0];

			// Path to your service account JSON file
			const KEY_PATH = path.join(__dirname, '/running-events-444113-f9aa6932cb24.json');

			const startDateTime = new Date(`${data}T${pradzios_laikas}:00+03:00`); // Lithuania is UTC+2 (or UTC+3 in daylight saving)
			const endDateTime = new Date(`${data}T${pabaigos_laikas}:00+03:00`);

			// Set up Google OAuth2 client
			const auth = new google.auth.JWT(
				require(KEY_PATH).client_email, // Service Account Email
				null,
				require(KEY_PATH).private_key, // Private Key
				['https://www.googleapis.com/auth/calendar'], // Scopes
				null
			);

			// Get the calendar API client
			const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

			// Define event details
			const event = {
				summary: pavadinimas,
				location: adresas,
				description: aprasymas,
				start: {
					dateTime: startDateTime,
					timeZone: 'Europe/Vilnius',
				},
				end: {
					dateTime: endDateTime,
					timeZone: 'Europe/Vilnius',
				},
				attendees: [{ email: email }],
				reminders: send_reminders
					? {
							useDefault: false,
							overrides: [
								{ method: 'popup', minutes: 10 }, // 10 minutes before event
								{ method: 'popup', minutes: 60 }, // 1 hour before event
							],
					  }
					: undefined,
			};

			// Insert the event into the user's calendar
			await calendar.events.insert({
				calendarId: 'primary',
				resource: event,
			});

			console.log('Event created and reminders set');
		} catch (error) {
			console.error('Error adding event to Google Calendar:', error);
			throw new Error('Failed to add event to Google Calendar');
		}
	}
}

module.exports = RegistrationController;
