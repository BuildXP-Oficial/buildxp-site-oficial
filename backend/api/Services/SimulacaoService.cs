using System.Text.Json;
using System.Text.RegularExpressions;
using BuildXP.API.Models.Dtos;

namespace BuildXP.API.Services;

public class SimulacaoService
{
    private const int MaxHistorico = 16;
    private const int MaxMensagem = 1500;
    private const int MaxCenario = 800;

    private static readonly JsonSerializerOptions JsonOpcoes = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private readonly GroqChatClient _groq;
    private readonly ILogger<SimulacaoService> _logger;

    public SimulacaoService(GroqChatClient groq, ILogger<SimulacaoService> logger)
    {
        _groq = groq;
        _logger = logger;
    }

    public async Task<SimulacaoRespostaDto> ProcessarTurnoAsync(
        SimulacaoRequisicaoDto requisicao,
        CancellationToken ct = default)
    {
        var persona = SimulacaoPersonas.Normalizar(requisicao?.Persona);
        var cenario = RecortarLimite((requisicao?.Cenario ?? string.Empty).Trim(), MaxCenario);
        var mensagemUsuario = RecortarLimite((requisicao?.MensagemUsuario ?? string.Empty).Trim(), MaxMensagem);
        var historico = requisicao?.HistoricoMensagens ?? [];

        var mensagens = MontarMensagensTurno(persona, cenario, historico, mensagemUsuario);

        _logger.LogInformation(
            "Processando turno de simulação. Persona={Persona} Historico={Historico}",
            persona,
            historico.Count);

        var texto = await _groq.CompletarAsync(
            mensagens,
            temperature: 0.6,
            maxTokens: 1024,
            ct,
            aceitar: t => ExtrairRespostaTurno(t) is not null);
        var resposta = ExtrairRespostaTurno(texto);
        if (resposta is null)
        {
            throw new InvalidOperationException(
                "Nenhum modelo da Groq conseguiu processar o turno da simulação agora.");
        }

        return resposta;
    }

    public async Task<FeedbackSimulacaoDto> GerarFeedbackAsync(
        List<MensagemHistoricoDto> historico,
        CancellationToken ct = default)
    {
        var conversa = historico ?? [];
        if (conversa.Count == 0)
        {
            return new FeedbackSimulacaoDto
            {
                Relatorio = "Não houve conversa suficiente para avaliar a simulação.",
                Nota = 0,
                PontosFortes = [],
                PontosMelhoria = ["Participe de pelo menos um turno da simulação para receber um relatório."],
            };
        }

        var payloadHistorico = JsonSerializer.Serialize(
            conversa.Select(m => new
            {
                remetente = (m?.Remetente ?? string.Empty).Trim(),
                texto = RecortarLimite((m?.Texto ?? string.Empty).Trim(), MaxMensagem),
            }),
            JsonOpcoes);

        var mensagens = new List<object>
        {
            new { role = "system", content = MontarPromptFeedback() },
            new { role = "user", content = payloadHistorico },
        };

        _logger.LogInformation("Gerando feedback da simulação. Mensagens={Mensagens}", conversa.Count);

        var texto = await _groq.CompletarAsync(
            mensagens,
            temperature: 0.3,
            maxTokens: 1536,
            ct,
            aceitar: t => ExtrairFeedback(t) is not null);
        var feedback = ExtrairFeedback(texto);
        if (feedback is null)
        {
            throw new InvalidOperationException(
                "Nenhum modelo da Groq conseguiu gerar o feedback da simulação agora.");
        }

        return feedback;
    }

    private static List<object> MontarMensagensTurno(
        string persona,
        string cenario,
        List<MensagemHistoricoDto> historico,
        string mensagemUsuario)
    {
        var mensagens = new List<object>
        {
            new { role = "system", content = MontarSystemPromptPersona(persona, cenario) },
        };

        foreach (var item in NormalizarHistorico(historico, mensagemUsuario))
            mensagens.Add(new { role = item.Role, content = item.Content });

        if (!string.IsNullOrWhiteSpace(mensagemUsuario))
            mensagens.Add(new { role = "user", content = mensagemUsuario });
        else if (mensagens.Count == 1)
            mensagens.Add(new { role = "user", content = "Comece a simulação. Faça a abertura no papel da persona." });

        return mensagens;
    }

    private static string MontarSystemPromptPersona(string persona, string cenario)
    {
        var cenarioTexto = string.IsNullOrWhiteSpace(cenario)
            ? "Use um cenário realista de entrevista ou reunião de trabalho."
            : cenario;

        var papel = persona switch
        {
            "rh_cultura" =>
                """
                Você é recrutador de RH focado em cultura e fit comportamental.
                Avalie valores, colaboração, motivações de carreira e soft skills.
                Use o método STAR (Situação, Tarefa, Ação, Resultado): peça exemplos reais da vida profissional.
                Não aceite respostas genéricas — peça o que a pessoa fez, com quem, o que aconteceu depois.
                Tom acolhedor, mas firme e curioso. Sem jargão técnico de engenharia.
                """,
            "tech_lead_gerente" =>
                """
                Você é tech lead e gerente da área. Una excelência técnica com responsabilidade de gestão, de forma colaborativa e profissional.
                No lado técnico: arquitetura, código limpo, boas práticas, qualidade e trade-offs — cobrando profundidade sem humilhar nem interromper de forma rude.
                No lado de gestão: prazos, priorização, impacto de negócio e como a pessoa decide sob restrição.
                Alterne as duas lentes de forma natural. Tom direto, construtivo e curioso. Se a resposta for vaga, peça um exemplo ou uma justificativa, como um líder que quer entender — não como um interrogatório.
                """,
            "stakeholder_negocios" =>
                """
                Você é um stakeholder de negócios / cliente leigo em tecnologia.
                Não use jargão técnico. Se o candidato falar em termos de engenharia, peça para traduzir em valor, custo, prazo e risco.
                Foque em: o que isso muda para o usuário ou para o negócio, quanto custa, quando entrega, o que acontece se atrasar.
                Faça perguntas simples, concretas e muito cobradoras. Tom de quem paga a conta e precisa entender.
                """,
            _ =>
                """
                Você conduz uma entrevista ou reunião profissional.
                Faça perguntas diretas, uma de cada vez, e aprofunde a partir da resposta anterior.
                """,
        };

        return
            $$"""
            Você está em uma simulação da plataforma BuildXP (entrevistas e reuniões difíceis).
            Responda SEMPRE em português brasileiro. Nunca use inglês. Permaneça 100% no personagem.

            Persona: {{persona}}
            {{papel}}

            Cenário: {{cenarioTexto}}

            Regras de fluidez (entrevista real):
            - Fale só como a persona. Não dê dicas de coach no meio da conversa.
            - Reaja ao que o usuário acabou de dizer; não ignore a resposta para pular para um roteiro.
            - Uma pergunta principal por turno (no máximo um follow-up curto).
            - Comece com abertura natural no cenário e uma primeira pergunta concreta.
            - Progrida: aqueça, aprofunde, pressione um ponto fraco, feche. Não despeje um questionário.
            - Frases curtas, tom falado, sem enumerar 1-2-3 como lista de prova.
            - Encerre a simulação (finalizada=true) só quando a reunião/entrevista chegar a um desfecho natural, o usuário se despedir, ou já houver material suficiente (cerca de 8 falas do usuário). Na abertura e nos primeiros turnos, finalizada deve ser false.

            Responda APENAS com um JSON válido, sem markdown e sem texto extra, neste formato:
            {
              "respostaPersona": "fala da persona neste turno",
              "finalizada": false
            }
            """;
    }

    private static string MontarPromptFeedback() =>
        """
        Você é um coach de comunicação profissional da plataforma BuildXP.
        Responda SEMPRE em português brasileiro. Nunca use inglês.

        Analise o histórico da simulação (entrevistas / reuniões difíceis).
        Avalie a performance do USUÁRIO (remetente usuario, user ou candidato), não da persona.

        Critérios: clareza, argumentação, postura sob pressão, objetividade e se a pessoa respondeu ao que foi cobrado
        (exemplos STAR, profundidade técnica, tradução para negócio — conforme o que a persona cobrou).

        Responda APENAS com um JSON válido, sem markdown e sem texto extra, neste formato:
        {
          "relatorio": "2 a 4 frases com a avaliação geral",
          "nota": 0,
          "pontosFortes": ["ponto forte 1", "ponto forte 2"],
          "pontosMelhoria": ["ponto de melhoria 1", "ponto de melhoria 2"]
        }

        A nota é um inteiro de 0 a 10. Inclua pelo menos um item em pontosFortes e um em pontosMelhoria quando houver conversa.
        """;

    private static List<(string Role, string Content)> NormalizarHistorico(
        List<MensagemHistoricoDto> historico,
        string mensagemAtual)
    {
        if (historico.Count == 0)
            return [];

        var limpo = new List<(string Role, string Content)>();
        foreach (var item in historico)
        {
            var texto = RecortarLimite((item?.Texto ?? string.Empty).Trim(), MaxMensagem);
            if (string.IsNullOrWhiteSpace(texto))
                continue;

            var remetente = (item?.Remetente ?? string.Empty).Trim().ToLowerInvariant();
            var role = EhUsuario(remetente) ? "user" : "assistant";
            limpo.Add((role, texto));
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

    private static bool EhUsuario(string remetente) =>
        remetente is "usuario" or "user" or "candidato" or "aluna" or "aluno";

    private static SimulacaoRespostaDto? ExtrairRespostaTurno(string? texto)
    {
        var json = ExtrairJson(texto);
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            var lido = JsonSerializer.Deserialize<SimulacaoRespostaDto>(json, JsonOpcoes);
            if (lido is null || string.IsNullOrWhiteSpace(lido.RespostaPersona))
                return null;
            lido.RespostaPersona = lido.RespostaPersona.Trim();
            return lido;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static FeedbackSimulacaoDto? ExtrairFeedback(string? texto)
    {
        var json = ExtrairJson(texto);
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            var lido = JsonSerializer.Deserialize<FeedbackSimulacaoDto>(json, JsonOpcoes);
            if (lido is null)
                return null;

            if (string.IsNullOrWhiteSpace(lido.Relatorio))
                return null;

            lido.Relatorio = lido.Relatorio.Trim();
            lido.Nota = Math.Clamp(lido.Nota, 0, 10);
            lido.PontosFortes ??= [];
            lido.PontosMelhoria ??= [];
            return lido;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string ExtrairJson(string? texto)
    {
        if (string.IsNullOrWhiteSpace(texto))
            return string.Empty;

        var bruto = texto.Trim();
        var fence = Regex.Match(bruto, @"```(?:json)?\s*([\s\S]*?)```", RegexOptions.IgnoreCase);
        if (fence.Success)
            bruto = fence.Groups[1].Value.Trim();

        var inicio = bruto.IndexOf('{');
        var fim = bruto.LastIndexOf('}');
        if (inicio < 0 || fim <= inicio)
            return string.Empty;

        return bruto[inicio..(fim + 1)];
    }

    private static string RecortarLimite(string texto, int max) =>
        texto.Length <= max ? texto : texto[..max];
}
