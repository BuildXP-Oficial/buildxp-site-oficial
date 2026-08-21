using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using BuildXP.API.Models.Dtos;

namespace BuildXP.API.Services;

public class RotinaService
{
    private const string GroqChatCompletionsUrl = "https://api.groq.com/openai/v1/chat/completions";

    private static readonly string[] GroqModelos =
    [
        "openai/gpt-oss-20b",
        "openai/gpt-oss-120b",
        "qwen/qwen3.6-27b",
        "llama-3.3-70b-versatile",
    ];

    private static readonly JsonSerializerOptions JsonOpcoes = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<RotinaService> _logger;

    public RotinaService(IHttpClientFactory httpClientFactory, ILogger<RotinaService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<RotinaRespostaDto> AjustarRotinaAsync(RotinaRequisicaoDto requisicao)
    {
        var tarefas = requisicao?.TarefasAtuais ?? [];
        var energia = NormalizarEnergia(requisicao?.NivelEnergia);
        var horas = Math.Max(0, requisicao?.HorasDisponiveis ?? 0);

        var apiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException(
                "A chave da API Groq não está configurada. Defina a variável de ambiente GROQ_API_KEY.");
        }

        var payloadUsuario = JsonSerializer.Serialize(
            new
            {
                nivelEnergia = energia,
                horasDisponiveis = horas,
                tarefasAtuais = tarefas,
            },
            JsonOpcoes);

        var mensagens = new object[]
        {
            new { role = "system", content = MontarSystemPrompt() },
            new { role = "user", content = payloadUsuario },
        };

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(45);

        _logger.LogInformation(
            "Ajustando rotina via Groq. Energia={Energia} Horas={Horas} Tarefas={Tarefas}",
            energia,
            horas,
            tarefas.Count);

        Exception? ultimoErro = null;
        foreach (var modelo in GroqModelos)
        {
            try
            {
                var texto = await TentarModeloAsync(client, apiKey.Trim(), modelo, mensagens);
                var resposta = ExtrairResposta(texto, tarefas);
                if (resposta is not null)
                {
                    _logger.LogInformation("Rotina ajustada com o modelo {Modelo}", modelo);
                    return resposta;
                }

                _logger.LogWarning("Groq modelo {Modelo} não devolveu JSON de rotina válido. Tentando o próximo.", modelo);
            }
            catch (UnauthorizedAccessException)
            {
                throw;
            }
            catch (Exception ex)
            {
                ultimoErro = ex;
                _logger.LogWarning(ex, "Groq modelo {Modelo} falhou na rotina. Tentando o próximo.", modelo);
            }
        }

        throw new InvalidOperationException(
            "Nenhum modelo da Groq conseguiu ajustar a rotina agora.",
            ultimoErro);
    }

    private static string MontarSystemPrompt() =>
        """
        Você é um assistente sênior de produtividade e planejamento de rotina.
        Responda SEMPRE em português brasileiro. Nunca use inglês.

        Analise NivelEnergia (alta, media, baixa) e HorasDisponiveis.
        Regras:
        - Energia baixa: priorize só as tarefas mais urgentes. Tarefas menos urgentes e com Flexivel=true podem ser adiadas ou aliviadas (não force um dia cheio).
        - Energia media: equilibre urgência e duração para caber nas horas disponíveis.
        - Energia alta: pode sugerir uma distribuição mais intensa, desde que a soma das durações das tarefas ativas caiba em HorasDisponiveis.

        Não invente tarefas novas. Preserve Id, Titulo, DuracaoMinutos, Urgencia, Concluida e Flexivel de cada item; você pode reordenar, marcar Concluida se já estiver concluída, e usar Flexivel para justificar remarcação.
        Tarefas já concluídas ficam no fim da lista e não consomem as horas do dia.

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
          "mensagemAgente": "Explique em 2 a 4 frases por que a rotina foi reorganizada com base na energia e nas horas."
        }
        """;

    private async Task<string?> TentarModeloAsync(
        HttpClient client,
        string apiKey,
        string modelo,
        object[] mensagens)
    {
        var payload = new
        {
            model = modelo,
            temperature = 0.3,
            max_tokens = 2048,
            messages = mensagens,
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, GroqChatCompletionsUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload, JsonOpcoes),
            Encoding.UTF8,
            "application/json");

        using var response = await client.SendAsync(request);
        var corpo = await response.Content.ReadAsStringAsync();

        if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
        {
            _logger.LogError("Groq recusou a chave da API na rotina (status {Status}).", (int)response.StatusCode);
            throw new UnauthorizedAccessException("A chave da API Groq foi recusada.");
        }

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "Groq modelo {Modelo} retornou {Status} na rotina. Corpo={Corpo}",
                modelo,
                (int)response.StatusCode,
                Recortar(corpo));
            return null;
        }

        return ExtrairTextoDaResposta(corpo);
    }

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

    private static string ExtrairTextoDaResposta(string json)
    {
        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("choices", out var choices) || choices.GetArrayLength() == 0)
            return string.Empty;

        var message = choices[0].GetProperty("message");
        if (message.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.String)
            return content.GetString() ?? string.Empty;

        if (message.TryGetProperty("reasoning", out var reasoning) && reasoning.ValueKind == JsonValueKind.String)
            return reasoning.GetString() ?? string.Empty;

        return string.Empty;
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

    private static string Recortar(string texto) =>
        texto.Length <= 120 ? texto : texto[..117] + "…";
}
