using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using BuildXP.API.Models.Dtos;

namespace BuildXP.API.Services;

public class ConhecimentoChatService
{
    private const string GroqChatCompletionsUrl = "https://api.groq.com/openai/v1/chat/completions";
    private const int MaxHistorico = 8;
    private const int MaxMensagem = 1500;
    private const int MaxConteudoCard = 6000;

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
    private readonly ILogger<ConhecimentoChatService> _logger;

    public ConhecimentoChatService(
        IHttpClientFactory httpClientFactory,
        ILogger<ConhecimentoChatService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<ConhecimentoChatRespostaDto> ResponderAsync(ConhecimentoChatRequisicaoDto requisicao)
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
        var texto = await ConsultarGroqAsync(tema, conteudoCard, mensagem, requisicao?.Historico);
        return new ConhecimentoChatRespostaDto
        {
            RespostaAgente = texto,
        };
    }

    private async Task<string> ConsultarGroqAsync(
        string tema,
        string conteudoCard,
        string mensagemUsuario,
        List<ConhecimentoChatMensagemDto>? historico)
    {
        var apiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException(
                "A chave da API Groq não está configurada. Defina a variável de ambiente GROQ_API_KEY.");
        }

        var mensagens = MontarMensagensGroq(tema, conteudoCard, mensagemUsuario, historico);
        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(45);

        _logger.LogInformation(
            "Consultando Groq. Tema={Tema} Mensagem={Mensagem} Historico={Historico}",
            tema,
            Recortar(mensagemUsuario),
            mensagens.Count - 2);

        Exception? ultimoErro = null;

        foreach (var modelo in GroqModelos)
        {
            try
            {
                var texto = await TentarModeloAsync(client, apiKey.Trim(), modelo, mensagens);
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

    private async Task<string?> TentarModeloAsync(
        HttpClient client,
        string apiKey,
        string modelo,
        List<object> mensagens)
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

    private static string RecortarLimite(string texto, int max) =>
        texto.Length <= max ? texto : texto[..max];

    private static string Recortar(string texto) =>
        texto.Length <= 120 ? texto : texto[..117] + "…";
}
