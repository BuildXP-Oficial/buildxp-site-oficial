using System.Net;
using System.Text;
using BuildXP.API;
using BuildXP.API.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace BuildXP.Tests;

public class GroqChatClientTests
{
    [Fact]
    public async Task Devolve_o_texto_quando_a_Groq_responde()
    {
        var json = """{"choices":[{"message":{"content":"olá da groq"}}]}""";
        var cliente = CriarCliente(Resposta(HttpStatusCode.OK, json));

        var texto = await cliente.CompletarAsync([new { role = "user", content = "oi" }], 0.2, 64);

        Assert.Equal("olá da groq", texto);
    }

    [Fact]
    public async Task Recusa_chave_invalida_sem_tentar_os_outros_modelos()
    {
        var cliente = CriarCliente(Resposta(HttpStatusCode.Unauthorized, """{"error":"no"}"""));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            cliente.CompletarAsync([new { role = "user", content = "oi" }], 0.2, 64));
    }

    [Fact]
    public async Task Esgota_os_modelos_e_sinaliza_groq_indisponivel()
    {
        var falhas = Enumerable.Range(0, GroqChatClient.Modelos.Length)
            .Select(_ => Resposta(HttpStatusCode.ServiceUnavailable, "busy"))
            .ToArray();
        var cliente = CriarCliente(falhas);

        await Assert.ThrowsAsync<GroqIndisponivelException>(() =>
            cliente.CompletarAsync([new { role = "user", content = "oi" }], 0.2, 64));
    }

    private static GroqChatClient CriarCliente(params HttpResponseMessage[] respostas)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["GroqApiKey"] = "gsk_teste",
            })
            .Build();

        return new GroqChatClient(
            new FabricaHttp(new SequenciaHandler(respostas)),
            config,
            NullLogger<GroqChatClient>.Instance);
    }

    private static HttpResponseMessage Resposta(HttpStatusCode status, string corpo) =>
        new(status)
        {
            Content = new StringContent(corpo, Encoding.UTF8, "application/json"),
        };

    private sealed class FabricaHttp(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }

    private sealed class SequenciaHandler(params HttpResponseMessage[] respostas) : HttpMessageHandler
    {
        private readonly Queue<HttpResponseMessage> _respostas = new(respostas);

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(_respostas.Dequeue());
    }
}

public class BancoNaSubidaTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Sem_connection_string_nao_prepara_o_banco(string? connectionString)
    {
        Assert.False(BancoNaSubida.TemConnectionString(connectionString));
    }

    [Fact]
    public void Em_desenvolvimento_sem_banco_usa_sentinela_e_nao_explode_no_EF()
    {
        var conexao = BancoNaSubida.ParaEf(null, desenvolvimento: true);
        Assert.Equal(BancoNaSubida.ConexaoSentinelaDesenvolvimento, conexao);
    }

    [Fact]
    public void Em_producao_sem_banco_falha_na_subida()
    {
        Assert.Throws<InvalidOperationException>(() => BancoNaSubida.ParaEf(null, desenvolvimento: false));
    }

    [Fact]
    public void Flag_de_teste_pula_a_preparacao_mesmo_com_connection_string()
    {
        var anterior = Environment.GetEnvironmentVariable("BUILDXP_SKIP_DB");
        try
        {
            Environment.SetEnvironmentVariable("BUILDXP_SKIP_DB", "1");
            Assert.False(BancoNaSubida.DevePreparar("Host=localhost;Database=buildxp"));
        }
        finally
        {
            Environment.SetEnvironmentVariable("BUILDXP_SKIP_DB", anterior);
        }
    }
}
