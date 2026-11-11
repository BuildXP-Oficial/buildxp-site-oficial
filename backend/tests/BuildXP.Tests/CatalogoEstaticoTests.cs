using BuildXP.API.Services;
using Xunit;

namespace BuildXP.Tests;

public class CatalogoEstaticoTests
{
    [Fact]
    public void Lista_os_sete_cards_publicos_sem_banco()
    {
        var catalogo = new CatalogoEstatico(EncontrarWwwroot());
        var lista = catalogo.Listar();

        Assert.Equal(7, lista.Count);
        Assert.Equal(
            new[] { "git", "docker", "npm", "dotnet", "python", "api", "ia" },
            lista.Select(c => c.Slug).ToArray());
        Assert.All(lista, c => Assert.True(c.IsPublished));
        Assert.All(lista, c => Assert.Empty(c.Referencias));
    }

    [Fact]
    public void Git_carrega_referencias_do_cheat_html()
    {
        var catalogo = new CatalogoEstatico(EncontrarWwwroot());
        var git = catalogo.BuscarPorSlug("git");

        Assert.NotNull(git);
        Assert.NotEmpty(git.Referencias);
        Assert.Contains(git.Referencias, r => r.Comando.Contains("git init", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Integrandoumaapi_e_alias_de_api()
    {
        var catalogo = new CatalogoEstatico(EncontrarWwwroot());
        var card = catalogo.BuscarPorSlug("integrandoumaapi");

        Assert.NotNull(card);
        Assert.Equal("api", card.Slug);
    }

    [Fact]
    public void Slug_desconhecido_volta_nulo()
    {
        var catalogo = new CatalogoEstatico(EncontrarWwwroot());
        Assert.Null(catalogo.BuscarPorSlug("nao-existe"));
    }

    private static string EncontrarWwwroot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, "api", "wwwroot");
            if (Directory.Exists(Path.Combine(candidate, "data", "cheat-html")))
                return candidate;
            dir = dir.Parent;
        }

        throw new DirectoryNotFoundException("wwwroot da API não encontrado a partir dos testes.");
    }
}
