namespace BuildXP.API.Models;

public class CardReadmeShare
{
    public int Id { get; set; }
    public int? CardId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string GithubLink { get; set; } = string.Empty;
    public Guid OwnerToken { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public SkillCard? Card { get; set; }
}
