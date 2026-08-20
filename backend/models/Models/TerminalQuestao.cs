namespace BuildXP.API.Models;

public class TerminalQuestao
{
    public int Id { get; set; }

    public string Tema { get; set; } = string.Empty;

    public string Nivel { get; set; } = string.Empty;

    public string Titulo { get; set; } = string.Empty;

    public string Enunciado { get; set; } = string.Empty;

    public string ComandoEsperado { get; set; } = string.Empty;

    public int XpRecompensa { get; set; }
}
