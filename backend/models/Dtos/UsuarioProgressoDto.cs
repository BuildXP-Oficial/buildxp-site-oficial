using BuildXP.API.Models;

namespace BuildXP.API.Models.Dtos;

public class UsuarioProgressoDto
{
    public int Id { get; set; }

    public int XpTotal { get; set; }

    public int NivelAtual { get; set; }

    public int DesafiosCompletados { get; set; }

    public bool SubiuDeNivel { get; set; }

    public static UsuarioProgressoDto FromEntity(UsuarioProgresso origem, bool subiuDeNivel = false) => new()
    {
        Id = origem.Id,
        XpTotal = origem.XpTotal,
        NivelAtual = origem.NivelAtual,
        DesafiosCompletados = origem.DesafiosCompletados,
        SubiuDeNivel = subiuDeNivel,
    };
}

public class AdicionarXpRequest
{
    public int Xp { get; set; }

    public int? DesafioId { get; set; }
}
