using Resend;

namespace BuildXP.API.Services;

public class EmailService
{
    private readonly IResend _resend;
    private readonly IConfiguration _config;

    public EmailService(IResend resend, IConfiguration config)
    {
        _resend = resend;
        _config = config;
    }

    // e-mail que você recebe quando chega um feedback novo
    public async Task NotificarNovoFeedbackAsync(string nome, string mensagem)
    {
        var de = _config["Resend:De"]!;
        var para = _config["Resend:EmailAdmin"]!;

        var email = new EmailMessage
        {
            From = de,
            To = { para },
            Subject = "BuildXP — Novo feedback aguardando aprovação",
            HtmlBody = $"""
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
                  <h2 style="color:#39d353;">BuildXP — Novo Feedback</h2>
                  <p><strong>De:</strong> {nome}</p>
                  <p><strong>Mensagem:</strong></p>
                  <blockquote style="border-left:3px solid #39d353;padding-left:1rem;color:#555;">
                    {mensagem}
                  </blockquote>
                  <p>Acesse o dashboard para aprovar ou rejeitar.</p>
                </div>
            """
        };

        await _resend.EmailSendAsync(email);
    }

    // e-mail de convite para colaborador criar senha
    public async Task EnviarConviteColaboradorAsync(string emailColaborador, string token)
    {
        var de = _config["Resend:De"]!;
        var link = $"http://localhost:5021/dashboard.html?convite={token}";

        var email = new EmailMessage
        {
            From = de,
            To = { emailColaborador },
            Subject = "BuildXP — Você foi convidado como colaborador",
            HtmlBody = $"""
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
                  <h2 style="color:#39d353;">BuildXP — Convite de Colaborador</h2>
                  <p>Você foi adicionado como colaborador do BuildXP.</p>
                  <p>Clique no botão abaixo para criar sua senha e acessar o painel:</p>
                  <a href="{link}"
                     style="display:inline-block;margin-top:1rem;padding:0.75rem 2rem;
                            background:#39d353;color:#000;text-decoration:none;
                            border-radius:6px;font-weight:bold;">
                    CRIAR SENHA E ACESSAR
                  </a>
                  <p style="color:#999;font-size:0.85rem;margin-top:1.5rem;">
                    Este link expira em 24 horas.
                  </p>
                </div>
            """
        };

        await _resend.EmailSendAsync(email);
    }

    public async Task EnviarCodigoRecuperacaoSenhaAsync(string emailDestino, string codigo)
    {
        var de = _config["Resend:De"]
                 ?? throw new InvalidOperationException("Resend:De não configurado.");
        var email = new EmailMessage
        {
            From = de,
            To = { emailDestino.Trim() },
            Subject = "BuildXP — Código para recuperar senha",
            HtmlBody = $"""
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;">
                  <h2 style="color:#0d47a1;">BuildXP — Recuperação de senha</h2>
                  <p>Seu código no painel admin (válido por <strong>15 minutos</strong>):</p>
                  <p style="font-size:1.85rem;letter-spacing:0.35em;font-weight:700;font-family:ui-monospace,monospace;padding:0.75rem 1rem;background:#f4f6fb;border-radius:8px;display:inline-block;">{codigo}</p>
                  <p style="color:#666;font-size:0.9rem;margin-top:1.25rem;">Se você não pediu a recuperação, pode ignorar este e-mail.</p>
                </div>
                """
        };

        await _resend.EmailSendAsync(email);
    }
}