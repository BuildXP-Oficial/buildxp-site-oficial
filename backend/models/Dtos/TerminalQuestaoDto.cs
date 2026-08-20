using BuildXP.API.Models;

namespace BuildXP.API.Models.Dtos;

public class TerminalQuestaoDto
{
    public int Id { get; set; }

    public string Tema { get; set; } = string.Empty;

    public string Nivel { get; set; } = string.Empty;

    public string Titulo { get; set; } = string.Empty;

    public string Enunciado { get; set; } = string.Empty;

    public string ComandoEsperado { get; set; } = string.Empty;

    public int XpRecompensa { get; set; }

    public static TerminalQuestaoDto FromEntity(TerminalQuestao origem) => new()
    {
        Id = origem.Id,
        Tema = origem.Tema,
        Nivel = origem.Nivel,
        Titulo = origem.Titulo,
        Enunciado = origem.Enunciado,
        ComandoEsperado = origem.ComandoEsperado,
        XpRecompensa = origem.XpRecompensa,
    };
}

