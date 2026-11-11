using System.ComponentModel.DataAnnotations;
using BuildXP.API.Models.Dtos;
using Xunit;

namespace BuildXP.Tests;

public class ConhecimentoChatRequisicaoDtoTests
{
    [Fact]
    public void Recusa_historico_maior_que_16_mensagens()
    {
        var dto = new ConhecimentoChatRequisicaoDto
        {
            MensagemUsuario = "oi",
            Historico = Enumerable.Range(0, 17)
                .Select(_ => new ConhecimentoChatMensagemDto { Papel = "user", Conteudo = "x" })
                .ToList(),
        };

        Assert.False(Validar(dto));
    }

    [Fact]
    public void Aceita_pedido_dentro_dos_tetos()
    {
        var dto = new ConhecimentoChatRequisicaoDto
        {
            MensagemUsuario = "como copiar um cheap code?",
            TemaOuCardAtual = "git",
        };

        Assert.True(Validar(dto), "pedido válido do chat não deveria falhar");
    }

    private static bool Validar(object dto)
    {
        var resultados = new List<ValidationResult>();
        return Validator.TryValidateObject(dto, new ValidationContext(dto), resultados, validateAllProperties: true);
    }
}

public class RotinaRequisicaoDtoTests
{
    [Fact]
    public void Recusa_mais_de_20_tarefas()
    {
        var dto = new RotinaRequisicaoDto
        {
            NivelEnergia = "alta",
            HorasDisponiveis = 2,
            TarefasAtuais = Enumerable.Range(0, 21)
                .Select(i => new TarefaDto { Id = $"{i}", Titulo = $"tema {i}" })
                .ToList(),
        };

        Assert.False(Validar(dto));
    }

    [Fact]
    public void Recusa_horas_fora_de_0_a_24()
    {
        var dto = new RotinaRequisicaoDto
        {
            NivelEnergia = "media",
            HorasDisponiveis = 25,
        };

        Assert.False(Validar(dto));
    }

    [Fact]
    public void Aceita_plano_dentro_dos_tetos()
    {
        var dto = new RotinaRequisicaoDto
        {
            NivelEnergia = "baixa",
            HorasDisponiveis = 1,
            TarefasAtuais = [new TarefaDto { Id = "git", Titulo = "revisar git", DuracaoMinutos = 30 }],
        };

        Assert.True(Validar(dto), "pedido válido da rotina não deveria falhar");
    }

    private static bool Validar(object dto)
    {
        var resultados = new List<ValidationResult>();
        return Validator.TryValidateObject(dto, new ValidationContext(dto), resultados, validateAllProperties: true);
    }
}
