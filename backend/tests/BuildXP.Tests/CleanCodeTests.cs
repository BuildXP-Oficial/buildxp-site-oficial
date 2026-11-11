using BuildXP.API;
using BuildXP.API.Controllers;
using Xunit;

namespace BuildXP.Tests;

public class JwtChaveTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(JwtChave.PlaceholderAntigo)]
    public void Recusa_chave_vazia_ou_placeholder_antigo(string? chave)
    {
        Assert.Throws<InvalidOperationException>(() => JwtChave.Exigir(chave));
    }

    [Fact]
    public void Recusa_chave_com_menos_de_32_bytes()
    {
        Assert.Throws<InvalidOperationException>(() => JwtChave.Exigir("chave-curta"));
    }

    [Fact]
    public void Aceita_chave_com_pelo_menos_32_caracteres()
    {
        var chave = new string('a', 32);
        Assert.Equal(chave, JwtChave.Exigir(chave));
    }
}

public class IaErroHttpTests
{
    [Fact]
    public void Groq_indisponivel_vira_503()
    {
        Assert.Equal(503, IaErroHttp.StatusPara(new GroqIndisponivelException("groq fora")));
    }

    [Fact]
    public void Chave_recusada_vira_503()
    {
        Assert.Equal(503, IaErroHttp.StatusPara(new UnauthorizedAccessException("chave recusada")));
    }

    [Fact]
    public void Erro_inesperado_vira_500()
    {
        Assert.Equal(500, IaErroHttp.StatusPara(new InvalidOperationException("bug interno")));
    }
}
