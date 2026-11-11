using System.Text.Json;
using System.Text.RegularExpressions;
using BuildXP.API.Models.Dtos;

namespace BuildXP.API.Services;

public class RotinaService
{
    private static readonly JsonSerializerOptions JsonOpcoes = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private readonly GroqChatClient _groq;
    private readonly ILogger<RotinaService> _logger;

    public RotinaService(GroqChatClient groq, ILogger<RotinaService> logger)
    {
        _groq = groq;
        _logger = logger;
    }

    public async Task<RotinaRespostaDto> AjustarRotinaAsync(
        RotinaRequisicaoDto requisicao,
        CancellationToken ct = default)
    {
        var tarefas = requisicao?.TarefasAtuais ?? [];
        var energia = NormalizarEnergia(requisicao?.NivelEnergia);
        var horas = Math.Max(0, requisicao?.HorasDisponiveis ?? 0);

        var payloadUsuario = JsonSerializer.Serialize(
            new
            {
                nivelEnergia = energia,
                horasDisponiveis = horas,
                tarefasAtuais = tarefas,
            },
            JsonOpcoes);

        var mensagens = new List<object>
        {
            new { role = "system", content = MontarSystemPrompt() },
            new { role = "user", content = payloadUsuario },
        };

        _logger.LogInformation(
            "Ajustando rotina via Groq. Energia={Energia} Horas={Horas} Tarefas={Tarefas}",
            energia,
            horas,
            tarefas.Count);

        var texto = await _groq.CompletarAsync(
            mensagens,
            temperature: 0.3,
            maxTokens: 2048,
            ct,
            aceitar: t => ExtrairResposta(t, tarefas) is not null);
        var resposta = ExtrairResposta(texto, tarefas);
        if (resposta is null)
        {
            throw new InvalidOperationException(
                "Nenhum modelo da Groq conseguiu ajustar a rotina agora.");
        }

        return resposta;
    }

    private static string MontarSystemPrompt() =>
        """
        Você é um tutor e planejador de estudos da plataforma BuildXP.
        Responda SEMPRE em português brasileiro. Nunca use inglês.

        O aluno escolheu temas/cards técnicos para estudar ou revisar hoje (Git, Docker, NPM, .NET, Python, Java, APIs, IA ou outros cards da plataforma).
        Cada item em tarefasAtuais é uma sessão de estudo: Id identifica a sessão, Titulo é o tema/card (Git, Docker, Python, .NET, Java, etc.), DuracaoMinutos é o tempo estimado, Urgencia é o nível de foco (1 a 5), Flexivel indica se a sessão pode ir para outro dia.

        Analise NivelEnergia (alta, media, baixa) e HorasDisponiveis.
        Regras:
        - Energia baixa: foque em um único tema ou em revisão leve (conceitos, cheap codes, fixação). Evite encadear vários conteúdos densos. Sessões menos urgentes e Flexivel=true podem ficar para outro dia.
        - Energia media: alterne um bloco de estudo com uma revisão, cabendo nas horas disponíveis.
        - Energia alta: pode sugerir uma sequência mais intensa (temas mais complexos, trilha iniciante + prática no terminal), desde que a soma das durações ativas caiba em HorasDisponiveis.

        Não invente temas novos. Preserve Id, Titulo, DuracaoMinutos, Urgencia, Concluida e Flexivel; você pode reordenar as sessões e usar Flexivel para justificar remarcação.
        Sessões já concluídas ficam no fim e não consomem as horas do dia.

        Na mensagemAgente, explique a ordem do cronograma como um tutor: por que aquele tema vem primeiro, o que cabe hoje e o que fica para revisão depois.

        Responda APENAS com um JSON válido, sem markdown e sem texto extra, neste formato:
        {
          "tarefasAjustadas": [
            {
              "id": "string",
              "titulo": "string",
              "duracaoMinutos": 0,
              "urgencia": 0,
              "concluida": false,
              "flexivel": false
            }
          ],
          "mensagemAgente": "Explique em 2 a 4 frases o plano de estudos com base na energia e no tempo livre."
        }
        """;

    private static RotinaRespostaDto? ExtrairResposta(string? texto, List<TarefaDto> originais)
    {
        var json = ExtrairJson(texto);
        if (string.IsNullOrWhiteSpace(json))
            return null;

        RotinaRespostaDto? lido;
        try
        {
            lido = JsonSerializer.Deserialize<RotinaRespostaDto>(json, JsonOpcoes);
        }
        catch (JsonException)
        {
            return null;
        }

        if (lido is null)
            return null;

        if (lido.TarefasAjustadas is null || lido.TarefasAjustadas.Count == 0)
            lido.TarefasAjustadas = originais.Select(ClonarTarefa).ToList();

        if (string.IsNullOrWhiteSpace(lido.MensagemAgente))
            lido.MensagemAgente = "Reorganizei a rotina com base na sua energia e nas horas disponíveis.";

        return lido;
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

    private static string NormalizarEnergia(string? bruto)
    {
        var e = (bruto ?? string.Empty).Trim().ToLowerInvariant();
        e = e.Replace("é", "e", StringComparison.Ordinal);
        return e switch
        {
            "alta" or "alto" => "alta",
            "baixa" or "baixo" => "baixa",
            _ => "media",
        };
    }

    private static TarefaDto ClonarTarefa(TarefaDto origem) => new()
    {
        Id = origem.Id,
        Titulo = origem.Titulo,
        DuracaoMinutos = origem.DuracaoMinutos,
        Urgencia = origem.Urgencia,
        Concluida = origem.Concluida,
        Flexivel = origem.Flexivel,
    };
}
