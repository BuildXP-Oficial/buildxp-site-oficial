using BuildXP.API.Models.Dtos;

namespace BuildXP.API.Services;

public class ConhecimentoChatService
{
    private const int MaxHistorico = 8;
    private const int MaxMensagem = 1500;
    private const int MaxConteudoCard = 6000;

    private readonly GroqChatClient _groq;
    private readonly ILogger<ConhecimentoChatService> _logger;

    public ConhecimentoChatService(GroqChatClient groq, ILogger<ConhecimentoChatService> logger)
    {
        _groq = groq;
        _logger = logger;
    }

    public async Task<ConhecimentoChatRespostaDto> ResponderAsync(
        ConhecimentoChatRequisicaoDto requisicao,
        CancellationToken ct = default)
    {
        var mensagem = RecortarLimite((requisicao?.MensagemUsuario ?? string.Empty).Trim(), MaxMensagem);
        var tema = (requisicao?.TemaOuCardAtual ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(tema))
            tema = "conhecimento";

        if (string.IsNullOrWhiteSpace(mensagem))
        {
            return new ConhecimentoChatRespostaDto
            {
                RespostaAgente = $"Estou aqui como especialista em {tema}. Pergunte sobre o que acabou de ler no card — um comando, um conceito ou um trecho que não fechou.",
            };
        }

        var conteudoCard = RecortarLimite((requisicao?.ConteudoCard ?? string.Empty).Trim(), MaxConteudoCard);
        var mensagens = MontarMensagensGroq(tema, conteudoCard, mensagem, requisicao?.Historico);

        _logger.LogInformation(
            "Consultando Groq. Tema={Tema} Mensagem={Mensagem} Historico={Historico}",
            tema,
            Recortar(mensagem),
            mensagens.Count - 2);

        var texto = await _groq.CompletarAsync(mensagens, temperature: 0.4, maxTokens: 1024, ct);
        return new ConhecimentoChatRespostaDto
        {
            RespostaAgente = texto,
        };
    }

    private static List<object> MontarMensagensGroq(
        string tema,
        string conteudoCard,
        string mensagemUsuario,
        List<ConhecimentoChatMensagemDto>? historico)
    {
        var blocoConteudo = string.IsNullOrWhiteSpace(conteudoCard)
            ? "O conteúdo textual do card não foi enviado nesta requisição. Responda só com o que souber do tema, sem inventar slides."
            : conteudoCard;

        var system =
            $"Você é um tutor focado exclusivamente no tema: {tema}. " +
            "Responda SEMPRE em português brasileiro, mesmo ao recusar uma pergunta fora do tema. Nunca use inglês. " +
            $"Você só deve responder a dúvidas pertinentes a {tema} e ao conteúdo do card atual. " +
            "Use o material abaixo como a matéria que o aluno está estudando. Não invente passos que não estejam nele. " +
            $"Se o usuário fizer perguntas sobre assuntos não relacionados (ex: perguntar de Python em um card de NPM ou Docker), " +
            $"responda educadamente em português explicando que você é o especialista deste tema específico ({tema}) e oriente o usuário a focar no assunto do card. " +
            "Seja conciso, direto e amigável. Prefira respostas curtas. " +
            "Use markdown simples (**negrito**, `código` e blocos ```) só quando ajudar a explicar.\n\n" +
            $"--- MATERIAL DO CARD ---\n{blocoConteudo}\n--- FIM DO MATERIAL ---";

        var mensagens = new List<object>
        {
            new { role = "system", content = system },
        };

        foreach (var item in NormalizarHistorico(historico, mensagemUsuario))
            mensagens.Add(new { role = item.Role, content = item.Content });

        mensagens.Add(new { role = "user", content = mensagemUsuario });
        return mensagens;
    }

    private static List<(string Role, string Content)> NormalizarHistorico(
        List<ConhecimentoChatMensagemDto>? historico,
        string mensagemAtual)
    {
        if (historico is null || historico.Count == 0)
            return [];

        var limpo = new List<(string Role, string Content)>();
        foreach (var item in historico)
        {
            var conteudo = RecortarLimite((item?.Conteudo ?? string.Empty).Trim(), MaxMensagem);
            if (string.IsNullOrWhiteSpace(conteudo))
                continue;

            var papel = (item?.Papel ?? string.Empty).Trim().ToLowerInvariant();
            var role = papel is "assistant" or "agent" or "assistente" ? "assistant" : "user";
            limpo.Add((role, conteudo));
        }

        if (limpo.Count > 0
            && limpo[^1].Role == "user"
            && string.Equals(limpo[^1].Content, mensagemAtual, StringComparison.Ordinal))
        {
            limpo.RemoveAt(limpo.Count - 1);
        }

        if (limpo.Count > MaxHistorico)
            limpo = limpo.Skip(limpo.Count - MaxHistorico).ToList();

        return limpo;
    }

    private static string RecortarLimite(string texto, int max) =>
        texto.Length <= max ? texto : texto[..max];

    private static string Recortar(string texto) =>
        texto.Length <= 120 ? texto : texto[..117] + "…";
}
