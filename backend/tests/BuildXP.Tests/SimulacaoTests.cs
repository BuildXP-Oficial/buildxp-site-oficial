using System.ComponentModel.DataAnnotations;
using BuildXP.API.Models.Dtos;
using BuildXP.API.Services;
using Xunit;

namespace BuildXP.Tests;

public class SimulacaoPersonasTests
{
    [Theory]
    [InlineData(null, "rh_cultura")]
    [InlineData("", "rh_cultura")]
    [InlineData("rh", "rh_cultura")]
    [InlineData("Recrutador RH", "rh_cultura")]
    [InlineData("tech_lead", "tech_lead_gerente")]
    [InlineData("gerente", "tech_lead_gerente")]
    [InlineData("cliente", "stakeholder_negocios")]
    [InlineData("stakeholder", "stakeholder_negocios")]
    public void Normalizar_mapeia_os_apelidos_das_tres_personas(string? entrada, string esperado)
    {
        Assert.Equal(esperado, SimulacaoPersonas.Normalizar(entrada));
    }
}

public class SimulacaoRequisicaoDtoTests
{
    [Fact]
    public void Recusa_cenario_maior_que_800_caracteres()
    {
        var dto = new SimulacaoRequisicaoDto
        {
            Cenario = new string('a', 801),
        };

        var resultados = new List<ValidationResult>();
        var ok = Validator.TryValidateObject(dto, new ValidationContext(dto), resultados, validateAllProperties: true);

        Assert.False(ok);
        Assert.Contains(resultados, r => r.MemberNames.Contains(nameof(SimulacaoRequisicaoDto.Cenario)));
    }

    [Fact]
    public void Aceita_pedido_dentro_dos_tetos()
    {
        var dto = new SimulacaoRequisicaoDto
        {
            Persona = "rh_cultura",
            Cenario = "entrevista para vaga junior",
            MensagemUsuario = "Olá",
        };

        var resultados = new List<ValidationResult>();
        var ok = Validator.TryValidateObject(dto, new ValidationContext(dto), resultados, validateAllProperties: true);

        Assert.True(ok, string.Join("; ", resultados.Select(r => r.ErrorMessage)));
    }
}
