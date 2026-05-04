using Microsoft.EntityFrameworkCore;   //using é tipo "importar" 
using BuildXP.API.Models;             //você está dizendo ao C# quais bibliotecas e namespaces vai usar nesse arquivo

namespace BuildXP.API.Data;

public class AppDbContext : DbContext  //herda tudo que o DbContext do Entity Framework Core tem
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
        // construtor vazio — o base(options) já faz tudo
    }

    // cada DbSet representa uma tabela no banco de dados
    public DbSet<Feedback> Feedbacks { get; set; }
    public DbSet<SkillCard> SkillCards { get; set; }
    public DbSet<Slide> Slides { get; set; }
    public DbSet<ConteudoSlide> ConteudosSlide { get; set; }
    public DbSet<ReferenciaRapida> ReferenciasRapidas { get; set; }
    public DbSet<RecuperacaoSenha> RecuperacoesSenha { get; set; }
    public DbSet<Colaborador> Colaboradores { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // configura o tamanho máximo dos campos de texto no banco

        // Feedback
        modelBuilder.Entity<Feedback>(entity =>
        {
            entity.Property(f => f.Nome).HasMaxLength(100);
            entity.Property(f => f.Mensagem).HasMaxLength(1000);
        });

        // SkillCard
        modelBuilder.Entity<SkillCard>(entity =>
        {
            entity.Property(s => s.Titulo).HasMaxLength(60);
            entity.Property(s => s.Icone).HasMaxLength(10);
            entity.Property(s => s.Classe).HasMaxLength(40);
            entity.Property(s => s.Raridade).HasMaxLength(20);
            entity.Property(s => s.CorBorda).HasMaxLength(7);   // ex: #39d353
            entity.Property(s => s.Descricao).HasMaxLength(300);
        });

        // ReferenciaRapida
        modelBuilder.Entity<ReferenciaRapida>(entity =>
        {
            entity.Property(r => r.Comando).HasMaxLength(200);
            entity.Property(r => r.Descricao).HasMaxLength(200);
            entity.Property(r => r.Categoria).HasMaxLength(50);
        });

    }
}