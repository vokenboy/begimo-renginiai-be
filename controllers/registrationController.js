const db = require('../db'); // Assume you have a database connection set up
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
//const { OAuth2Client } = require('google-auth-library');
//const session = require('express-session');

// OAuth2 credentials from Google Cloud Console
//const CLIENT_ID = '94208964171-54aum2bs35hr60rsr1fb2d2abs70d25d.apps.googleusercontent.com';
//const CLIENT_SECRET = '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';
//const REDIRECT_URI = 'http://localhost:3000/oauth2callback'; // Redirect URI from Google Cloud Console

// Create OAuth2 client
//const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
class RegistrationController
{

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
    };
    

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
        const result = await db.query(query, [vardas, el_pastas, parseInt(renginio_id), parseInt(naudotojo_id), send_reminders]);

        // Get the tokens from the session
        //const tokens = req.session.tokens;

        if (send_reminders ) {
            await RegistrationController.addEventToGoogleCalendar(renginio_id, el_pastas, send_reminders);
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
    try {
        const { registrationId } = req.params; // Extract from URL params
        const { userId } = req.body; // Extract from request body

        // Ensure that both registrationId and userId are provided
        if (!registrationId || !userId) {
            return res.status(400).json({ message: 'Registration ID and User ID are required' });
        }

        // Query to delete the registration
        const query = 'DELETE FROM registracijos WHERE id = $1 AND naudotojo_id = $2 RETURNING *;';
        const result = await db.query(query, [registrationId, userId]);

        // If no rows are returned, the registration was not found or the user is unauthorized
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Registration not found or unauthorized' });
        }

        // Successfully deleted the registration
        res.status(200).json({ message: 'Registration deleted successfully' });
    } catch (error) {
        console.error('Error deleting registration:', error);
        res.status(500).json({ message: 'Failed to delete registration' });
    }
};


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
            const insertResult = await db.query(insertQuery, [vardas, el_pastas, renginio_id, naudotojo_id, send_reminders]);

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
// Redirect to Google OAuth2 authorization page
/*static async authenticate(req, res) {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Request refresh token
        scope: ['https://www.googleapis.com/auth/calendar'],
    });
    res.redirect(authUrl);
}*/

// OAuth2 callback route to exchange code for tokens
/*static async oauth2callback(req, res) {
    const { code } = req.query;

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Save the tokens in the session or database
        req.session.tokens = tokens;

        res.send('Authentication successful! You can now close this window.');
    } catch (error) {
        console.error('Error during OAuth2 callback:', error);
        res.status(500).send('Error during authentication');
    }
}*/

static async addEventToGoogleCalendar(eventId, send_reminders) {
    try {
        // Fetch event details (you can modify this query based on your database schema)
        const eventQuery = 'SELECT * FROM renginys WHERE id = $1';
        const eventResult = await db.query(eventQuery, [eventId]);

        if (eventResult.rows.length === 0) {
            throw new Error('Event not found');
        }

        const { pavadinimas, data, adresas, aprasymas } = eventResult.rows[0];

        const registrationQuery = 'SELECT el_pastas FROM registracijos WHERE renginio_id = $1 LIMIT 1';
        const registrationResult = await db.query(registrationQuery, [eventId]);

        if (registrationResult.rows.length === 0) {
            throw new Error('No registration found for this event');
        }

        const email = registrationResult.rows[0].el_pastas; // Get the email from the registration

        // Use the OAuth2 client credentials from the session
        
        /*if (!tokens) {
            throw new Error('No authentication tokens found');
        }*/

        //oauth2Client.setCredentials(tokens);

        // Path to your service account JSON file
        const KEY_PATH = path.join(__dirname, '../running-events-444113-f9aa6932cb24.json');

       // const startDateTime = new Date(`${data}T${pradzios_laikas}:00+03:00`); // Lithuania is UTC+2 (or UTC+3 in daylight saving)
       // const endDateTime = new Date(`${data}T${pabaigos_laikas}:00+03:00`);

        const serviceAccount = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
        const auth = new google.auth.JWT(
            serviceAccount.client_email,
            null,
            serviceAccount.private_key,
            ['https://www.googleapis.com/auth/calendar']
        );
        
        // Get the calendar API client
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client  });

        // Define event details
        const event = {
            summary: pavadinimas,
            location: adresas,
            description: aprasymas,
            start: {
                dateTime: data,
            },
            end: {
                dateTime: data,
            },
            attendees: [{ email: email }],
            reminders: send_reminders ? {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 10 }, // 10 minutes before event
                    { method: 'popup', minutes: 60 }, // 1 hour before event
                ],
            } : undefined,
        };
        // Insert the event into the Google Calendar
        const calendarResponse = await calendar.events.insert({
            calendarId: 'primary', // Use the primary calendar of the user
            resource: event,
        }, (err, res) => {
            if (err) {
                console.log('Error creating event: ' + err);
            } else {
                console.log('Event created: ' + res.data.summary);
            }
        });

        console.log('Event created and reminders set');
    } catch (error) {
        console.error('Error adding event to Google Calendar:', error);
        throw new Error('Failed to add event to Google Calendar');
    }
}

}


module.exports = RegistrationController
          