namespace BuildXP.API.Models;

/// <summary>Conta leve só para persistir o README do "Construa aqui" (separada de admin/colaborador).</summary>
public class MarkdownBuilderUser
{
    public int Id { get; set; }
    public string Usuario { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public int SecurityQuestionId { get; set; }
    public string SecurityAnswerHash { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public MarkdownBuilderDoc? Document { get; set; }
}

/// <summary>Documento markdown + campos de texto puro (pitch / arquitetura / regras).</summary>
public class MarkdownBuilderDoc
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public MarkdownBuilderUser? User { get; set; }

    public string Titulo { get; set; } = "Meu README";
    public string ConteudoMarkdown { get; set; } = string.Empty;

    /// <summary>Texto puro — não passa pelo parser markdown.</summary>
    public string Pitch { get; set; } = string.Empty;
    public string Arquitetura { get; set; } = string.Empty;
    public string RegrasEvento { get; set; } = string.Empty;

    public bool XpDocCriada { get; set; }
    public bool XpProjetoAtualizado { get; set; }
    public bool XpReadmeCompleto { get; set; }
    public int XpTotal { get; set; }

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
}
