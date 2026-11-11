using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using BuildXP.API;

namespace BuildXP.API.Services;

public class GroqChatClient
{
    public const string HttpClientName = "Groq";
    public const string GroqChatCompletionsUrl = "https://api.groq.com/openai/v1/chat/completions";

    public static readonly string[] Modelos =
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
    private readonly IConfiguration _config;
    private readonly ILogger<GroqChatClient> _logger;

    public GroqChatClient(
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<GroqChatClient> logger)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
    }

    public async Task<string> CompletarAsync(
        IReadOnlyList<object> mensagens,
        double temperature,
        int maxTokens,
        CancellationToken ct = default,
        Func<string, bool>? aceitar = null)
    {
        var apiKey = GroqChave.Obter(_config);
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new GroqIndisponivelException(
                "A chave da API Groq não está configurada. Defina GROQ_API_KEY ou GroqApiKey.");
        }

        var client = _httpClientFactory.CreateClient(HttpClientName);
        Exception? ultimoErro = null;

        foreach (var modelo in Modelos)
        {
            ct.ThrowIfCancellationRequested();
            try
            {
                var texto = await TentarModeloAsync(client, apiKey, modelo, mensagens, temperature, maxTokens, ct);
                if (!string.IsNullOrWhiteSpace(texto) && (aceitar is null || aceitar(texto)))
                {
                    _logger.LogInformation("Groq respondeu com o modelo {Modelo}", modelo);
                    return texto.Trim();
                }

                if (!string.IsNullOrWhiteSpace(texto))
                    _logger.LogWarning("Groq modelo {Modelo} devolveu texto inválido para o contrato. Tentando o próximo.", modelo);
                else
                    _logger.LogWarning("Groq modelo {Modelo} devolveu texto vazio. Tentando o próximo.", modelo);
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (UnauthorizedAccessException)
            {
                throw;
            }
            catch (Exception ex)
            {
                ultimoErro = ex;
                _logger.LogWarning(ex, "Groq modelo {Modelo} falhou. Tentando o próximo.", modelo);
            }
        }

        throw new GroqIndisponivelException(
            "Nenhum modelo da Groq conseguiu gerar a resposta agora.",
            ultimoErro);
    }

    private async Task<string?> TentarModeloAsync(
        HttpClient client,
        string apiKey,
        string modelo,
        IReadOnlyList<object> mensagens,
        double temperature,
        int maxTokens,
        CancellationToken ct)
    {
        var payload = new
        {
            model = modelo,
            temperature,
            max_tokens = maxTokens,
            messages = mensagens,
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, GroqChatCompletionsUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload, JsonOpcoes),
            Encoding.UTF8,
            "application/json");

        using var response = await client.SendAsync(request, ct);
        var corpo = await response.Content.ReadAsStringAsync(ct);

        if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
        {
            _logger.LogError("Groq recusou a chave da API (status {Status}).", (int)response.StatusCode);
            throw new UnauthorizedAccessException("A chave da API Groq foi recusada.");
        }

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "Groq modelo {Modelo} retornou {Status}. Corpo={Corpo}",
                modelo,
                (int)response.StatusCode,
                Recortar(corpo));
            return null;
        }

        return ExtrairTextoDaResposta(corpo);
    }

    private static string ExtrairTextoDaResposta(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (!root.TryGetProperty("choices", out var choices) || choices.GetArrayLength() == 0)
            return string.Empty;

        var first = choices[0];
        if (!first.TryGetProperty("message", out var message))
            return string.Empty;

        if (message.TryGetProperty("content", out var content))
        {
            var texto = ExtrairConteudo(content);
            if (!string.IsNullOrWhiteSpace(texto))
                return texto;
        }

        if (message.TryGetProperty("reasoning", out var reasoning))
        {
            var texto = ExtrairConteudo(reasoning);
            if (!string.IsNullOrWhiteSpace(texto))
                return texto;
        }

        return string.Empty;
    }

    private static string ExtrairConteudo(JsonElement content)
    {
        if (content.ValueKind == JsonValueKind.String)
            return content.GetString() ?? string.Empty;

        if (content.ValueKind == JsonValueKind.Array)
        {
            var partes = new List<string>();
            foreach (var item in content.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.String)
                {
                    partes.Add(item.GetString() ?? string.Empty);
                    continue;
                }

                if (item.ValueKind == JsonValueKind.Object
                    && item.TryGetProperty("text", out var text)
                    && text.ValueKind == JsonValueKind.String)
                {
                    partes.Add(text.GetString() ?? string.Empty);
                }
            }

            return string.Join(string.Empty, partes);
        }

        return string.Empty;
    }

    private static string Recortar(string texto) =>
        texto.Length <= 120 ? texto : texto[..117] + "…";
}
