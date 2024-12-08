const db = require('../db'); // Database connection
const jwt = require('jsonwebtoken');

class CommentController {
	// Get all invitations
	static async fetchAllComments(req, res) {
		try {
			const { id } = req.params;
            console.log(id)
			if (!id) {
				return res.status(400).json({ error: 'Nėra renginio id' });
			}
			const comments = await db.query('SELECT * FROM komentaras WHERE renginio_id = $1', [id]);
			res.status(200).json(comments.rows);
		} catch (error) {
			console.error('Klaida gaunant komentarus:', error);
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}

	// Create a new invitation
	static async createComment(req, res) {
		try {
			const { tekstas, data, autoriaus_id, renginio_id } = req.body;

			if (!tekstas || !data || !autoriaus_id || !renginio_id) {
				return res.status(400).json({ error: 'Visi laukai yra privalomi' });
			}
            console.log(autoriaus_id);
            console.log(renginio_id);
			const result = await db.query(
				`INSERT INTO komentaras(tekstas, data, renginio_id, naudotojo_id)
	             VALUES ($1, $2, $3, $4) RETURNING *`,
				[tekstas, data, renginio_id, autoriaus_id]
			);

			res.status(201).json({ message: 'Komentaras sukurtas sėkmingai', komentaras: result.rows[0] });
		} catch (error) {
			console.error('Klaida kuriant komentarą:', error);
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}

    static async deleteComment(req, res) {
		const { id } = req.params;
		try {

			await db.query('DELETE FROM komentaras WHERE id = $1', [id]);
			res.status(200).json({ message: 'Komentaras sėkmingai ištrintas' });
		} catch (error) {
			console.error('Klaida trinant komentarą:', error);
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}

    static async getComment(req, res) {
		const { id } = req.params;
		try {
			const comment = await db.query('SELECT * FROM komentaras WHERE id = $1', [id]);
			if (!comment.rows.length) {
				return res.status(404).json({ error: 'Pakvietimų nerasta' });
			}
			res.status(200).json(comment.rows);
		} catch (error) {
			console.error('Klaida gaunant pakvietimus pagal gavėjo ID:', error);
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}
    static async updateComment(req, res) {
		const { id } = req.params;
		try {
			const comment = await db.query('SELECT * FROM komentaras WHERE id = $1', [id]);
			if (!comment.rows.length) {
				return res.status(404).json({ error: 'Komentaras nerastas' });
			}

			const { tekstas, data, naudotojo_id, renginio_id } = req.body;

			await db.query(
				`UPDATE komentaras
                 SET tekstas = $1, data = $2, naudotojo_id = $3, renginio_id = $4
                 WHERE id = $5`,
				[
					tekstas || comment.rows[0].tekstas,
					data || comment.rows[0].data,
					naudotojo_id || comment.rows[0].naudotojo_id,
					renginio_id || comment.rows[0].renginio_id,
					id,
				]
			);

			res.status(200).json({ message: 'Komentaras atnaujintas sėkmingai' });
		} catch (error) {
			console.error('Klaida atnaujinant komentarą:', error);
			res.status(500).json({ error: 'Serverio klaida' });
		}
	}
    /*
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
    */
}

module.exports = CommentController;
