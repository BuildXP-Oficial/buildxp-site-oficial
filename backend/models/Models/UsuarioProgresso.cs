namespace BuildXP.API.Models;

public class UsuarioProgresso
{
    public int Id { get; set; }

    public int XpTotal { get; set; }

    public int NivelAtual { get; set; } = 1;

    public int DesafiosCompletados { get; set; }
}
