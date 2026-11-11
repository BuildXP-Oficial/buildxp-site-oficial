namespace BuildXP.API.Models;

public class SkillCard
{
    public int Id { get; set; }

    /// <summary>Identificador estável usado na URL da API e no dashboard (ex.: git, docker).</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>Tema visual: git, docker, npm, dotnet.</summary>
    public string Theme { get; set; } = string.Empty;

    public string Titulo { get; set; } = string.Empty;
    /// <summary>Ícone curto legado; preferir IconPrimarySrc.</summary>
    public string Icone { get; set; } = string.Empty;
    public string Classe { get; set; } = string.Empty;
    public string Raridade { get; set; } = string.Empty;
    public string CorBorda { get; set; } = "#39d353";
    public string Descricao { get; set; } = string.Empty;
    public string LinkBeginner { get; set; } = string.Empty;
    public string LinkRef { get; set; } = string.Empty;
    public string BtnPrimaryLabel { get; set; } = string.Empty;
    public string BtnSecondaryLabel { get; set; } = string.Empty;
    public string IconLayout { get; set; } = "single";
    public string IconPrimarySrc { get; set; } = string.Empty;
    public string IconPrimaryAlt { get; set; } = string.Empty;
    public byte[]? IconPrimaryBytes { get; set; }
    public string? IconPrimaryMimeType { get; set; }
    public string IconSecondarySrc { get; set; } = string.Empty;
    public string IconSecondaryAlt { get; set; } = string.Empty;
    public byte[]? IconSecondaryBytes { get; set; }
    public string? IconSecondaryMimeType { get; set; }
    public int Ordem { get; set; }
    public bool Ativo { get; set; } = true;
    public int XpAtual { get; set; }
    public int XpMaximo { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;

    /// <summary>terminal = treino + cheap codes; readmelabs = README Lab e comunidade.</summary>
    public string FinSlideType { get; set; } = "terminal";

    public List<Slide> Slides { get; set; } = [];
    public List<ReferenciaRapida> Referencias { get; set; } = [];
    public List<CardReadmeShare> ReadmeShares { get; set; } = [];
}

public class Slide
{
    public int Id { get; set; }
    public int CardId { get; set; }
    public int Ordem { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public bool Ativo { get; set; } = true;

    public SkillCard? Card { get; set; }
    public List<ConteudoSlide> Conteudos { get; set; } = [];
}

public class ConteudoSlide
{
    public int Id { get; set; }
    public int SlideId { get; set; }
    public TipoConteudo Tipo { get; set; }
    public string Texto { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public int Ordem { get; set; }

    public Slide? Slide { get; set; }
}

public class ReferenciaRapida
{
    public int Id { get; set; }
    public int CardId { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public int OrdemCategoria { get; set; }
    public string Comando { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public int OrdemItem { get; set; }
}

public enum TipoConteudo
{
    Comando,
    Observacao,
    Pausa,
    Fim,
}
