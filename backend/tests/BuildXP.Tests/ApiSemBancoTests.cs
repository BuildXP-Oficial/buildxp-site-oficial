using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace BuildXP.Tests;

public class ApiSemBancoTests : IClassFixture<ApiSemBancoFactory>
{
    private readonly HttpClient _client;

    public ApiSemBancoTests(ApiSemBancoFactory factory)
    {
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    [Fact]
    public async Task Health_sobe_sem_migrar_o_banco()
    {
        var resposta = await _client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);

        var corpo = await resposta.Content.ReadFromJsonAsync<HealthDto>();
        Assert.NotNull(corpo);
        Assert.False(string.IsNullOrWhiteSpace(corpo.Status));
        Assert.False(corpo.BancoConfigurado);
    }

    [Fact]
    public async Task Pagina_do_simulador_sobe_sem_migrar_o_banco()
    {
        var resposta = await _client.GetAsync("/simulador.html");
        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
    }

    [Fact]
    public async Task Pagina_da_rotina_sobe_sem_migrar_o_banco()
    {
        var resposta = await _client.GetAsync("/rotina.html");
        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
    }

    [Fact]
    public async Task Lista_publica_de_cards_usa_o_catalogo_estatico()
    {
        var resposta = await _client.GetAsync("/api/card");
        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);

        var cards = await resposta.Content.ReadFromJsonAsync<List<CardListaDto>>();
        Assert.NotNull(cards);
        Assert.Equal(7, cards.Count);
        Assert.Contains(cards, c => c.Slug == "git");
        Assert.Contains(cards, c => c.Slug == "python");
        Assert.Contains(cards, c => c.Slug == "ia");
        Assert.All(cards, c => Assert.False(string.IsNullOrEmpty(c.LinkBeginner)));
    }

    [Fact]
    public async Task Card_git_traz_cheap_codes_do_html_estatico()
    {
        var resposta = await _client.GetAsync("/api/card/git");
        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);

        var card = await resposta.Content.ReadFromJsonAsync<CardDetalheDto>();
        Assert.NotNull(card);
        Assert.Equal("git", card.Slug);
        Assert.NotEmpty(card.Referencias);
        Assert.Contains(card.Referencias, r => r.Comando.Contains("git init", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Alias_integrandoumaapi_aponta_para_api()
    {
        var resposta = await _client.GetAsync("/api/card/integrandoumaapi");
        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);

        var card = await resposta.Content.ReadFromJsonAsync<CardDetalheDto>();
        Assert.NotNull(card);
        Assert.Equal("api", card.Slug);
        Assert.NotEmpty(card.Referencias);
    }

    private sealed class HealthDto
    {
        public string Status { get; set; } = string.Empty;
        public bool BancoConfigurado { get; set; }
    }

    private sealed class CardListaDto
    {
        [JsonPropertyName("slug")]
        public string Slug { get; set; } = string.Empty;

        [JsonPropertyName("link_beginner")]
        public string LinkBeginner { get; set; } = string.Empty;
    }

    private sealed class CardDetalheDto
    {
        [JsonPropertyName("slug")]
        public string Slug { get; set; } = string.Empty;

        [JsonPropertyName("referencias")]
        public List<RefDto> Referencias { get; set; } = [];
    }

    private sealed class RefDto
    {
        [JsonPropertyName("comando")]
        public string Comando { get; set; } = string.Empty;
    }
}

public class ApiSemBancoFactory : WebApplicationFactory<Program>
{
    private const string VariavelPularBanco = "BUILDXP_SKIP_DB";
    private readonly string? _valorAnterior;

    public ApiSemBancoFactory()
    {
        _valorAnterior = Environment.GetEnvironmentVariable(VariavelPularBanco);
        Environment.SetEnvironmentVariable(VariavelPularBanco, "1");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("https_port", "");
        builder.UseSetting("Jwt:Chave", new string('k', 32));
        builder.UseSetting("ConnectionStrings:DefaultConnection", "");
    }

    protected override void Dispose(bool disposing)
    {
        Environment.SetEnvironmentVariable(VariavelPularBanco, _valorAnterior);
        base.Dispose(disposing);
    }
}
