using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using BuildXP.API.Models.Dtos;

namespace BuildXP.API.Services;

public class ConhecimentoChatService
{
    private const string GroqChatCompletionsUrl = "https://api.groq.com/openai/v1/chat/completions";

    /// <summary>
    /// Modelos de chat da Groq, do mais atual ao legado.
    /// Se um falhar (depreciado, 429, 5xx), tenta o próximo.
    /// </summary>
    private static readonly string[] GroqModelos =
    [
        "openai/gpt-oss-20b",
        "openai/gpt-oss-120b",
        "qwen/qwen3.6-27b",
        "groq/compound-mini",
        "groq/compound",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "llama-3.1-70b-versatile",
        "llama3-8b-8192",
        "llama3-70b-8192",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
        "gemma-7b-it",
        "qwen/qwen3-32b",
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "meta-llama/llama-4-maverick-17b-128e-instruct",
        "moonshotai/kimi-k2-instruct",
        "llama-3.2-3b-preview",
        "llama-3.2-1b-preview",
        "llama-3.2-90b-text-preview",
        "llama-3.2-11b-text-preview",
        "llama-3.3-70b-specdec",
        "deepseek-r1-distill-llama-70b",
        "allam-2-7b",
    ];

    private static readonly JsonSerializerOptions JsonOpcoes = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<ConhecimentoChatService> _logger;

    public ConhecimentoChatService(
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<ConhecimentoChatService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
    }

    public async Task<ConhecimentoChatRespostaDto> ResponderAsync(ConhecimentoChatRequisicaoDto requisicao)
    {
        var mensagem = (requisicao?.MensagemUsuario ?? string.Empty).Trim();
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

        var texto = await ConsultarGroqAsync(tema, mensagem);
        return new ConhecimentoChatRespostaDto
        {
            RespostaAgente = texto,
        };
    }

    private async Task<string> ConsultarGroqAsync(string tema, string mensagemUsuario)
    {
        var apiKey = ObterChaveApi();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException(
                "A chave da API Groq não está configurada. Defina GROQ_API_KEY ou GroqApiKey.");
        }

        var mensagens = new object[]
        {
            new
            {
                role = "system",
                content = $"Você é um tutor de tecnologia amigável, didático e especialista no seguinte tema: {tema}. Explique de forma simples e ajude o usuário com dúvidas sobre o conteúdo que ele está estudando.",
            },
            new
            {
                role = "user",
                content = mensagemUsuario,
            },
        };

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(45);

        _logger.LogInformation(
            "Consultando Groq. Tema={Tema} Mensagem={Mensagem}",
            tema,
            Recortar(mensagemUsuario));

        Exception? ultimoErro = null;

        foreach (var modelo in GroqModelos)
        {
            try
            {
                var texto = await TentarModeloAsync(client, apiKey, modelo, mensagens);
                if (!string.IsNullOrWhiteSpace(texto))
                {
                    _logger.LogInformation("Groq respondeu com o modelo {Modelo}", modelo);
                    return texto.Trim();
                }

                _logger.LogWarning("Groq modelo {Modelo} devolveu texto vazio. Tentando o próximo.", modelo);
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

        throw new InvalidOperationException(
            "Nenhum modelo da Groq conseguiu gerar a resposta agora.",
            ultimoErro);
    }

    private async Task<string?> TentarModeloAsync(
        HttpClient client,
        string apiKey,
        string modelo,
        object[] mensagens)
    {
        var payload = new
        {
            model = modelo,
            temperature = 0.4,
            max_tokens = 1024,
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

    private string? ObterChaveApi()
    {
        foreach (var valor in new[]
        {
            Environment.GetEnvironmentVariable("GROQ_API_KEY"),
            _config["GroqApiKey"],
            _config["Groq:ApiKey"],
        })
        {
            if (!string.IsNullOrWhiteSpace(valor))
                return valor.Trim();
        }

        return null;
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
