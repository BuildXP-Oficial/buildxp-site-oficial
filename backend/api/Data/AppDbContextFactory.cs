using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace BuildXP.API.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json")
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddUserSecrets(Assembly.GetExecutingAssembly(), optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connection = config.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connection))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection não está configurada. Use User Secrets, appsettings.Development.json (não versionado) ou a variável ConnectionStrings__DefaultConnection.");
        }

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(connection);

        return new AppDbContext(optionsBuilder.Options);
    }
}
