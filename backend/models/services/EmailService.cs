using System.Net;
using System.Net.Mail;

namespace BuildXP.API.Services;

public class EmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    // monta e envia o e-mail via SMTP do Gmail
    private async Task EnviarAsync(string para, string assunto, string htmlBody)
    {
        var smtp     = _config["Email:Smtp"]!;
        var porta    = int.Parse(_config["Email:Porta"]!);
        var usuario  = _config["Email:Usuario"]!;
        var senha    = _config["Email:Senha"]!;

        using var client = new SmtpClient(smtp, porta)
        {
            Credentials = new NetworkCredential(usuario, senha),
            EnableSsl = true
        };

        using var mensagem = new MailMessage
        {
            From       = new MailAddress(usuario, "BuildXP"),
            Subject    = assunto,
            Body       = htmlBody,
            IsBodyHtml = true
        };

        mensagem.To.Add(para);
        await client.SendMailAsync(mensagem);
    }

    // notifica quando chega feedback novo
    public async Task NotificarNovoFeedbackAsync(string nome, string categoria, string mensagem)
    {
        var para = _config["Email:EmailAdmin"]!;

        var html = $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
              <h2 style="color:#39d353;">BuildXP — Novo Feedback</h2>
              <p><strong>De:</strong> {nome}</p>
              <p><strong>Categoria:</strong> {categoria}</p>
              <p><strong>Mensagem:</strong></p>
              <blockquote style="border-left:3px solid #39d353;padding-left:1rem;color:#555;">
                {mensagem}
              </blockquote>
              <p>Acesse o dashboard para aprovar ou rejeitar.</p>
            </div>
        """;

        await EnviarAsync(para, "BuildXP — Novo feedback aguardando aprovação", html);
    }

    // convite para colaborador
    public async Task EnviarConviteColaboradorAsync(string emailColaborador, string token)
    {
        var baseUrl = (_config["App:PublicDashboardUrl"] ?? "").Trim().TrimEnd('/');
        if (string.IsNullOrEmpty(baseUrl))
            baseUrl = "http://localhost:5021";
        var link = $"{baseUrl}/dashboard.html?convite={token}";

        var html = $"""
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
        """;

        await EnviarAsync(emailColaborador, "BuildXP — Você foi convidado como colaborador", html);
    }

    // código de recuperação de senha
    public async Task EnviarCodigoRecuperacaoSenhaAsync(string emailDestino, string codigo)
    {
        var html = $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;">
              <h2 style="color:#0d47a1;">BuildXP — Recuperação de senha</h2>
              <p>Seu código (válido por <strong>15 minutos</strong>):</p>
              <p style="font-size:1.85rem;letter-spacing:0.35em;font-weight:700;
                        font-family:monospace;padding:0.75rem 1rem;
                        background:#f4f6fb;border-radius:8px;display:inline-block;">
                {codigo}
              </p>
              <p style="color:#666;font-size:0.9rem;margin-top:1.25rem;">
                Se você não pediu a recuperação, ignore este e-mail.
              </p>
            </div>
        """;

        await EnviarAsync(emailDestino, "BuildXP — Código para recuperar senha", html);
    }

    public async Task NotificarAlteracaoUsuarioAsync(string emailDestino, string novoNomeOuUsuario)
    {
        var html = $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;">
              <h2 style="color:#0d47a1;">BuildXP — Nome de utilizador atualizado</h2>
              <p>O seu nome de utilizador no painel foi alterado para:</p>
              <p style="font-size:1.1rem;font-weight:700;font-family:monospace;">{WebUtility.HtmlEncode(novoNomeOuUsuario)}</p>
              <p style="color:#666;font-size:0.9rem;">Se não foi você, altere a senha e contacte o administrador.</p>
            </div>
        """;

        await EnviarAsync(emailDestino, "BuildXP — Nome de utilizador alterado", html);
    }

    public async Task NotificarAlteracaoSenhaAsync(string emailDestino)
    {
        var html = """
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;">
              <h2 style="color:#0d47a1;">BuildXP — Senha alterada</h2>
              <p>A palavra-passe da sua conta BuildXP foi alterada com sucesso.</p>
              <p style="color:#666;font-size:0.9rem;">Se não foi você, contacte de imediato o administrador.</p>
            </div>
            """;

        await EnviarAsync(emailDestino, "BuildXP — Senha alterada", html);
    }
}