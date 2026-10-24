package service

import (
	"bytes"
	"fmt"
	"mime/multipart"
	"net/mail"
	"net/smtp"
	"strings"
	"text/template"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/config"
)

func sendSignupCode(cfg config.EmailConfig, to, code string) error {
	if cfg.SMTPHost == "" || cfg.SMTPUsername == "" || cfg.SMTPPassword == "" || cfg.From == "" {
		return fmt.Errorf("email delivery is not configured")
	}
	port := cfg.SMTPPort
	if port == "" {
		port = "587"
	}
	address := cfg.SMTPHost + ":" + port
	auth := smtp.PlainAuth("", cfg.SMTPUsername, cfg.SMTPPassword, cfg.SMTPHost)
	if strings.ContainsAny(to+cfg.From, "\r\n") {
		return fmt.Errorf("invalid email address")
	}
	toAddress, err := mail.ParseAddress(to)
	if err != nil {
		return fmt.Errorf("invalid recipient email address")
	}
	fromAddress, err := mail.ParseAddress(cfg.From)
	if err != nil {
		return fmt.Errorf("invalid sender email address")
	}

	var message bytes.Buffer
	_, _ = fmt.Fprintf(&message, "From: %s\r\nTo: %s\r\nSubject: Your Vedic Puja Sanskar verification code\r\nMIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary=\"", fromAddress.String(), toAddress.String())
	parts := multipart.NewWriter(&message)
	_, _ = fmt.Fprintf(&message, "%s\"\r\n\r\n", parts.Boundary())
	plainPart, err := parts.CreatePart(map[string][]string{"Content-Type": {"text/plain; charset=UTF-8"}, "Content-Transfer-Encoding": {"8bit"}})
	if err != nil {
		return err
	}
	_, _ = fmt.Fprintf(plainPart, "Your Vedic Puja Sanskar verification code is %s. It expires in 10 minutes. If you did not request this, you can ignore this email.\r\n", code)

	htmlPart, err := parts.CreatePart(map[string][]string{"Content-Type": {"text/html; charset=UTF-8"}, "Content-Transfer-Encoding": {"8bit"}})
	if err != nil {
		return err
	}
	const htmlEmail = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Verify your email</title></head>
  <body style="margin:0;padding:32px 12px;background-color:#f7f4ee;font-family:Arial,Helvetica,sans-serif;color:#292524;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your email verification code expires in 10 minutes.</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;background:#fffdfa;border:1px solid #f1e5cf;border-radius:20px;overflow:hidden;">
      <tr><td style="padding:28px 32px;background:#fff7e8;border-bottom:1px solid #f3e6ce;">
        <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#92400e;">🕉 Vedic Puja Sanskar</div>
        <div style="margin-top:7px;font-size:13px;color:#78716c;">A little confirmation for your account</div>
      </td></tr>
      <tr><td style="padding:36px 32px 30px;">
        <div style="width:52px;height:52px;line-height:52px;text-align:center;border-radius:16px;background:#fef3c7;color:#92400e;font-size:25px;">✉</div>
        <h1 style="margin:22px 0 10px;font-size:25px;line-height:1.25;font-weight:700;color:#292524;">Verify your email address</h1>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#57534e;">Use this one-time code to finish creating your account. For your security, it expires in <strong style="color:#44403c;">10 minutes</strong>.</p>
        <div style="margin:26px 0;padding:20px 12px;border:1px solid #f1dfbd;border-radius:14px;background:#fffbf2;text-align:center;">
          <div style="margin-bottom:8px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a16207;">Your verification code</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:34px;line-height:1.3;font-weight:700;letter-spacing:10px;color:#78350f;">{{.Code}}</div>
        </div>
        <p style="margin:0;font-size:13px;line-height:1.7;color:#78716c;">If you didn’t request this code, you can safely ignore this email. Your account won’t be created unless the code is verified.</p>
      </td></tr>
      <tr><td style="padding:18px 32px;background:#faf8f4;border-top:1px solid #eee7dc;font-size:11px;line-height:1.6;color:#a8a29e;">This is an automated message from Vedic Puja Sanskar. Please don’t reply to this email.</td></tr>
    </table>
  </body>
</html>`
	tmpl, err := template.New("signup-code").Parse(htmlEmail)
	if err != nil {
		return err
	}
	if err := tmpl.Execute(htmlPart, struct{ Code string }{Code: code}); err != nil {
		return err
	}
	if err := parts.Close(); err != nil {
		return err
	}
	return smtp.SendMail(address, auth, fromAddress.Address, []string{toAddress.Address}, message.Bytes())
}
