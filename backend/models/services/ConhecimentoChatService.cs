using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using BuildXP.API.Models.Dtos;

namespace BuildXP.API.Services;

public class ConhecimentoChatService
{
    private const string GroqChatCompletionsUrl = "https://api.groq.com/openai/v1/chat/completions";
    private const string GroqModelo = "llama-3.3-70b-versatile";

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

        var payload = new
        {
            model = GroqModelo,
            temperature = 0.4,
            max_tokens = 1024,
            messages = new object[]
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
            },
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, GroqChatCompletionsUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload, JsonOpcoes),
            Encoding.UTF8,
            "application/json");

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(45);

        _logger.LogInformation(
            "Consultando Groq. Tema={Tema} Mensagem={Mensagem}",
            tema,
            Recortar(mensagemUsuario));

        using var response = await client.SendAsync(request);
        var corpo = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError(
                "Groq retornou {Status}. Corpo={Corpo}",
                (int)response.StatusCode,
                Recortar(corpo));
            throw new InvalidOperationException("A API do Groq não conseguiu gerar a resposta agora.");
        }

        var texto = ExtrairTextoDaResposta(corpo);
        if (string.IsNullOrWhiteSpace(texto))
            throw new InvalidOperationException("A API do Groq não devolveu texto na resposta.");

        return texto.Trim();
    }

    private string? ObterChaveApi()
    {
        var env = Environment.GetEnvironmentVariable("GROQ_API_KEY");
        if (!string.IsNullOrWhiteSpace(env))
            return env.Trim();

        var config = _config["GroqApiKey"];
        if (!string.IsNullOrWhiteSpace(config))
            return config.Trim();

        return null;
    }

    private static string ExtrairTextoDaResposta(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (!root.TryGetProperty("choices", out var choices) || choices.GetArrayLength() == 0)
            return string.Empty;

        var first = choices[0];
        if (first.TryGetProperty("message", out var message)
            && message.TryGetProperty("content", out var content)
            && content.ValueKind == JsonValueKind.String)
        {
            return content.GetString() ?? string.Empty;
        }

        return string.Empty;
    }

    private static string Recortar(string texto) =>
        texto.Length <= 120 ? texto : texto[..117] + "…";
}
