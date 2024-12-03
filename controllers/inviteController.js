const db = require('../db'); // Database connection

class InviteController {
	// Get all invitations
	static async getAllInvitations(req, res) {
		try {
			const invitations = await db.query('SELECT * FROM pakvietimas');
			res.status(200).json(invitations.rows);
		} catch (error) {
			console.error('Klaida gaunant pakvietimus:', error);
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}

	// Get invitation by ID
	static async getInvitationById(req, res) {
		const { id } = req.params;
		try {
			const invitation = await db.query('SELECT * FROM pakvietimas WHERE id = $1', [id]);
			if (!invitation.rows.length) {
				return res.status(404).json({ error: 'Pakvietimas nerastas' });
			}
			res.status(200).json(invitation.rows[0]);
		} catch (error) {
			console.error('Klaida gaunant pakvietimą:', error);
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}

	// Create a new invitation
	static async createInvitation(req, res) {
		try {
			const { tekstas, data, statusas, siuntejo_id, gavejo_id, renginio_id } = req.body;

			if (!tekstas || !data || !statusas || !siuntejo_id || !gavejo_id || !renginio_id) {
				return res.status(400).json({ error: 'Visi laukai yra privalomi' });
			}

			const result = await db.query(
				`INSERT INTO pakvietimas (tekstas, data, statusas, siuntejo_id, gavejo_id, renginio_id)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
				[tekstas, data, statusas, siuntejo_id, gavejo_id, renginio_id]
			);

			res.status(201).json({ message: 'Pakvietimas sukurtas sėkmingai', pakvietimas: result.rows[0] });
		} catch (error) {
			console.error('Klaida kuriant pakvietimą:', error);
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}

	// Update an invitation by ID
	static async updateInvitationById(req, res) {
		const { id } = req.params;
		try {
			const invitation = await db.query('SELECT * FROM pakvietimas WHERE id = $1', [id]);
			if (!invitation.rows.length) {
				return res.status(404).json({ error: 'Pakvietimas nerastas' });
			}

			const { tekstas, data, statusas, siuntejo_id, gavejo_id, renginio_id } = req.body;

			await db.query(
				`UPDATE pakvietimas
                 SET tekstas = $1, data = $2, statusas = $3, siuntejo_id = $4, gavejo_id = $5, renginio_id = $6
                 WHERE id = $7`,
				[
					tekstas || invitation.rows[0].tekstas,
					data || invitation.rows[0].data,
					statusas || invitation.rows[0].statusas,
					siuntejo_id || invitation.rows[0].siuntejo_id,
					gavejo_id || invitation.rows[0].gavejo_id,
					renginio_id || invitation.rows[0].renginio_id,
					id,
				]
			);

			res.status(200).json({ message: 'Pakvietimas atnaujintas sėkmingai' });
		} catch (error) {
			console.error('Klaida atnaujinant pakvietimą:', error);
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}

	// Delete an invitation by ID
	static async deleteInvitationById(req, res) {
		const { id } = req.params;
		try {
			const invitation = await db.query('SELECT * FROM pakvietimas WHERE id = $1', [id]);
			if (!invitation.rows.length) {
				return res.status(404).json({ error: 'Pakvietimas nerastas' });
			}

			await db.query('DELETE FROM pakvietimas WHERE id = $1', [id]);
			res.status(200).json({ message: 'Pakvietimas sėkmingai ištrintas' });
		} catch (error) {
			console.error('Klaida trinant pakvietimą:', error);
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}

	// Fetch invitations by sender_id
	static async getInvitationsBySenderId(req, res) {
		const { senderId } = req.params;
		try {
			const invitations = await db.query('SELECT * FROM pakvietimas WHERE siuntejo_id = $1', [senderId]);
			if (!invitations.rows.length) {
				return res.status(404).json({ error: 'Pakvietimų nerasta' });
			}
			res.status(200).json(invitations.rows);
		} catch (error) {
			console.error('Klaida gaunant pakvietimus pagal siuntėjo ID:', error);
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}

	// Fetch invitations by receiver_id
	static async getInvitationsByReceiverId(req, res) {
		const { receiverId } = req.params;
		try {
			const invitations = await db.query('SELECT * FROM pakvietimas WHERE gavejo_id = $1', [receiverId]);
			if (!invitations.rows.length) {
				return res.status(404).json({ error: 'Pakvietimų nerasta' });
			}
			res.status(200).json(invitations.rows);
		} catch (error) {
			console.error('Klaida gaunant pakvietimus pagal gavėjo ID:', error);
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}
}

module.exports = InviteController;
