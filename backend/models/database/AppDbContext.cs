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
    public DbSet<AdminPerfil> AdminPerfis { get; set; }
    public DbSet<CardIconUpload> CardIconUploads { get; set; }
    public DbSet<MarkdownBuilderUser> MarkdownBuilderUsers { get; set; }
    public DbSet<MarkdownBuilderDoc> MarkdownBuilderDocs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // configura o tamanho máximo dos campos de texto no banco

        // Feedback
        modelBuilder.Entity<Feedback>(entity =>
        {
            entity.Property(f => f.Nome).HasMaxLength(100);
            entity.Property(f => f.Categoria).HasMaxLength(40);
            entity.Property(f => f.Mensagem).HasMaxLength(1000);
            entity.Property(f => f.ModeradoPor).HasMaxLength(120);
        });

        // SkillCard
        modelBuilder.Entity<SkillCard>(entity =>
        {
            entity.Property(s => s.Slug).HasMaxLength(48);
            entity.Property(s => s.Theme).HasMaxLength(32);
            entity.Property(s => s.Titulo).HasMaxLength(120);
            entity.Property(s => s.Icone).HasMaxLength(512);
            entity.Property(s => s.Classe).HasMaxLength(60);
            entity.Property(s => s.Raridade).HasMaxLength(32);
            entity.Property(s => s.CorBorda).HasMaxLength(7);   // ex: #39d353
            entity.Property(s => s.Descricao).HasColumnType("text");
            entity.Property(s => s.LinkBeginner).HasMaxLength(512);
            entity.Property(s => s.LinkRef).HasMaxLength(512);
            entity.Property(s => s.BtnPrimaryLabel).HasMaxLength(80);
            entity.Property(s => s.BtnSecondaryLabel).HasMaxLength(80);
            entity.Property(s => s.IconLayout).HasMaxLength(16);
            entity.Property(s => s.IconPrimarySrc).HasMaxLength(512);
            entity.Property(s => s.IconPrimaryAlt).HasMaxLength(200);
            entity.Property(s => s.IconSecondarySrc).HasMaxLength(512);
            entity.Property(s => s.IconSecondaryAlt).HasMaxLength(200);
            entity.HasIndex(s => s.Slug)
                .IsUnique()
                .HasFilter("\"Slug\" <> ''");
            entity.Property(s => s.IconPrimaryMimeType).HasMaxLength(64);
            entity.Property(s => s.IconSecondaryMimeType).HasMaxLength(64);
        });

        modelBuilder.Entity<CardIconUpload>(entity =>
        {
            entity.ToTable("CardIconUploads");
            entity.Property(u => u.MimeType).HasMaxLength(64);
            entity.Property(u => u.Data).HasColumnType("bytea");
        });

        // ReferenciaRapida — FK real na coluna CardId (SkillCardId na BD é legado / não usado pelo modelo)
        modelBuilder.Entity<ReferenciaRapida>(entity =>
        {
            entity.Property(r => r.Comando).HasMaxLength(200);
            entity.Property(r => r.Descricao).HasMaxLength(200);
            entity.Property(r => r.Categoria).HasMaxLength(50);
            entity.HasOne<SkillCard>()
                .WithMany(c => c.Referencias)
                .HasForeignKey(r => r.CardId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(r => r.CardId);
        });

        modelBuilder.Entity<Colaborador>(entity =>
        {
            entity.Property(c => c.Email).HasMaxLength(320);
            entity.Property(c => c.Senha).HasMaxLength(500);
            entity.Property(c => c.Usuario).HasMaxLength(80);
            entity.Property(c => c.FotoMimeType).HasMaxLength(64);
            entity.HasIndex(c => c.Usuario)
                .IsUnique()
                .HasFilter("\"Usuario\" IS NOT NULL");
        });

        modelBuilder.Entity<AdminPerfil>(entity =>
        {
            entity.ToTable("AdminPerfis");
            entity.Property(a => a.Usuario).HasMaxLength(80);
            entity.Property(a => a.Email).HasMaxLength(320);
            entity.Property(a => a.Senha).HasMaxLength(500);
            entity.Property(a => a.FotoMimeType).HasMaxLength(64);
            entity.HasIndex(a => a.Usuario).IsUnique();
        });

        modelBuilder.Entity<MarkdownBuilderUser>(entity =>
        {
            entity.ToTable("MarkdownBuilderUsers");
            entity.Property(u => u.Usuario).HasMaxLength(40);
            entity.Property(u => u.Nome).HasMaxLength(80);
            entity.Property(u => u.SenhaHash).HasMaxLength(128);
            entity.Property(u => u.SecurityAnswerHash).HasMaxLength(128);
            entity.HasIndex(u => u.Usuario).IsUnique();
            entity.HasOne(u => u.Document)
                .WithOne(d => d.User)
                .HasForeignKey<MarkdownBuilderDoc>(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MarkdownBuilderDoc>(entity =>
        {
            entity.ToTable("MarkdownBuilderDocs");
            entity.Property(d => d.Titulo).HasMaxLength(120);
            entity.Property(d => d.ConteudoMarkdown).HasColumnType("text");
            entity.Property(d => d.Pitch).HasColumnType("text");
            entity.Property(d => d.Arquitetura).HasColumnType("text");
            entity.Property(d => d.RegrasEvento).HasColumnType("text");
            entity.HasIndex(d => d.UserId).IsUnique();
        });

    }
}