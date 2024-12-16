({ MailerSend, EmailParams, Sender, Recipient } = require('mailersend'));

const mailersend = new MailerSend({
    apiKey: process.env.EMAIL_API_TOKEN,
});


class EmailController {
    static async sendPasswordRecoveryEmail(username, email, code) {
        console.log('sending password recovery email sent to:', email);
		const sentFrom = new Sender('serveris@trial-pxkjn41en30lz781.mlsender.net', 'Begimo renginiai');

        const recipients = [
        new Recipient(email, username)
        ];

        const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setReplyTo(sentFrom)
        .setSubject("Slaptažodžio atkūrimo nuoroda")
        .setHtml(`<strong>Norint pakeisti savo slaptažodį, atidarykite nuorodą: <a href="http://localhost:3000/changepassword/${code}">http://localhost:3000/changepassword/${code}</a></strong>`)
        .setText(`Norint pakeisti savo slaptažodį, atidarykite nuorodą: http://localhost:3000/changepassword/${code}`);
        await mailersend.email.send(emailParams);
    }
}

module.exports = EmailController;