({ MailerSend, EmailParams, Sender, Recipient } = require('mailersend'));

const mailersend = new MailerSend({
	apiKey: process.env.EMAIL_API_TOKEN,
});

class EmailController {
	static async sendPasswordRecoveryEmail(username, email, code) {
		console.log('sending password recovery email sent to:', email);
		const sentFrom = new Sender('serveris@trial-k68zxl2nke9lj905.mlsender.net', 'Begimo renginiai');

		const recipients = [new Recipient(email, username)];

		const emailParams = new EmailParams()
			.setFrom(sentFrom)
			.setTo(recipients)
			.setReplyTo(sentFrom)
			.setSubject('Slaptažodžio atkūrimo nuoroda')
			.setHtml(
				`<strong>Norint pakeisti savo slaptažodį, atidarykite nuorodą: <a href="http://localhost:3000/changepassword/${code}">http://localhost:3000/changepassword/${code}</a></strong>`
			)
			.setText(`Norint pakeisti savo slaptažodį, atidarykite nuorodą: http://localhost:3000/changepassword/${code}`);
		await mailersend.email.send(emailParams);
	}

	static async sendEventReminderEmail(username, email, link) {
		console.log('sending event reminder email sent to:', email);
		const sentFrom = new Sender('serveris@trial-k68zxl2nke9lj905.mlsender.net', 'Begimo renginiai');

		const recipients = [new Recipient(email, username)];

		const emailParams = new EmailParams()
			.setFrom(sentFrom)
			.setTo(recipients)
			.setReplyTo(sentFrom)
			.setSubject('Artėjantis renginys')
			.setHtml(`<strong>Sveiki, primename jog artėja renginys: <a href="${link}">${link}</a></strong>`)
			.setText(`Norint pakeisti savo slaptažodį, atidarykite nuorodą: ${link}`);
		await mailersend.email.send(emailParams);
	}

	static scheduleEmail(username, email, code, sendDate) {
		const currentTime = new Date();
		const delay = sendDate - currentTime; // Calculate time difference in milliseconds

		if (delay <= 0) {
			console.error('Send date must be in the future');
			return;
		}

		// Convert sendDate to a cron schedule (second, minute, hour, day of month, month, day of week)
		const sendAt = new Date(sendDate);
		const cronSchedule = `${sendAt.getSeconds()} ${sendAt.getMinutes()} ${sendAt.getHours()} ${sendAt.getDate()} ${
			sendAt.getMonth() + 1
		} *`;

		console.log(`Scheduled email to ${email} at: ${sendAt}`);

		cron.schedule(cronSchedule, async () => {
			try {
				await EmailController.sendPasswordRecoveryEmail(username, email, code);
				console.log(`Email successfully sent to ${email} at: ${new Date().toISOString()}`);
			} catch (error) {
				console.error('Error sending email:', error);
			}
		});
	}
}

module.exports = EmailController;
