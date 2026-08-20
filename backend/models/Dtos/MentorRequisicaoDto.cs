namespace BuildXP.API.Models.Dtos;

public class MentorRequisicaoDto
{
    public string ComandoUsuario { get; set; } = string.Empty;

    public string ComandoEsperado { get; set; } = string.Empty;

    /// <summary>csharp, python, java — vazio para comando de terminal.</summary>
    public string Linguagem { get; set; } = string.Empty;

    public string Enunciado { get; set; } = string.Empty;

    public string Feedback { get; set; } = string.Empty;

    public List<string> Criterios { get; set; } = new();
}
