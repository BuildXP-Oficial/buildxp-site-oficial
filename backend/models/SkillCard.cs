namespace BuildXP.API.Models; // Nome do Arquivo: SkillCard.cs

public class SkillCard // Classe do Modelo de SkillCard
{
    public int Id { get; set; } = 0; // ID da SkillCard
    public string Titulo { get; set; } = string.Empty; // Titulo da SkillCard
    public string Icone { get; set; } = string.Empty; // Icone da SkillCard
    public string Classe { get; set; } = string.Empty; // Classe da SkillCard ex: VERSION CONTROL 
    public string Raridade { get; set; } = string.Empty; // Raridade da SkillCard ex: ESSENTIAL
    public string CorBorda { get; set; } = "#39d353"; // Cor da Borda da SkillCard ex: #000000
    public string Descricao { get; set; } = string.Empty; // Descrição da SkillCard
    public int Ordem { get; set; } = 0; // Posição na página
    public bool Ativo { get; set; } = true; // Se a SkillCard está ativo 
    public int XpAtual { get; set; } = 0; // XP Calculado automaticamente
    public int XpMaximo { get; set; } = 0; // XP Máximo da SkillCard
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow; // Data de Criação da SkillCard - gerada automaticamente 
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow; // Só preenchido quando a SkillCard é atualizada 

    public List<Slide> Slides { get; set; } = []; // Um card tem vários slides 
    public List<ReferenciaRapida> Referencias { get; set; } = []; // Um card tem várias referências rápidas
}

public class Slide // Representa um passo da aba Iniciante
{
    public int Id { get; set; } = 0;
    public int CardId { get; set; } = 0;         // qual card esse slide pertence
    public int Ordem { get; set; } = 0;          // sequência dentro do card (01, 02, 03...)
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public bool Ativo { get; set; } = true;

    // Relacionamentos
    public SkillCard? Card { get; set; }                    // card pai (nem sempre carregado)
    public List<ConteudoSlide> Conteudos { get; set; } = []; // conteúdos dentro do slide
}

public class ConteudoSlide // Um item dentro de um slide
{
    public int Id { get; set; } = 0;
    public int SlideId {get; set; } = 0;
    public TipoConteudo Tipo {get; set; }
    public string Texto {get; set; } = string.Empty;
    public string Descricao {get; set; } = string.Empty;
    public int Ordem {get; set; } = 0;

    // Relacionamento
    public Slide ? Slide {get; set; } // slide pai
}

public class ReferenciaRapida // Uma seção da aba Referência Rápida (Cheat Codes)
{
    public int Id { get; set; } = 0;
    public int CardId {get; set;} = 0;        // qual card pertence
    public string Categoria {get; set; } = string.Empty; // nome da categoria ex: branches
    public int OrdemCategoria {get; set; } = 0;          //ordem do grupo entre os outros grupos
    public string Comando {get; set; } = string.Empty;    // comando ex: git branch
    public string Descricao {get; set; } = string.Empty;  // descrição do comando ex: cria uma nova branch
    public int OrdemItem {get; set; } = 0;               // ordem do item dentro do grupo
}


public enum TipoConteudo // Tipo de conteúdo dentro de um slide
{
    Comando,       //bloco de código a ser copiado
    Observacao,    //caixa verde de observação
    Pausa,         //pausa no slide
    Fim          //fim do slide
}
