using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Models;

namespace RecipeManager.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<RecipeTag> RecipeTags => Set<RecipeTag>();
    public DbSet<Collection> Collections => Set<Collection>();
    public DbSet<CollectionRecipe> CollectionRecipes => Set<CollectionRecipe>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.AuthSub).IsUnique();
            entity.Property(e => e.AuthSub).IsRequired().HasMaxLength(256);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.DisplayName).HasMaxLength(256);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Recipe configuration
        modelBuilder.Entity<Recipe>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Title);
            entity.HasIndex(e => e.CategoryId);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Type).IsRequired();
            entity.Property(e => e.Url).HasMaxLength(2000);
            entity.Property(e => e.StorageKey).HasMaxLength(500);
            entity.Property(e => e.Content);
            entity.Property(e => e.PreviewImageUrl).HasMaxLength(2000);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.SiteName).HasMaxLength(256);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Recipes)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Category)
                  .WithMany(c => c.Recipes)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Favorite configuration
        modelBuilder.Entity<Favorite>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.RecipeId });
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Favorites)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Recipe)
                  .WithMany(r => r.Favorites)
                  .HasForeignKey(e => e.RecipeId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Category configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Color).IsRequired().HasMaxLength(20);
        });

        // Tag configuration
        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Color).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Type).IsRequired();
        });

        // RecipeTag configuration
        modelBuilder.Entity<RecipeTag>(entity =>
        {
            entity.HasKey(e => new { e.RecipeId, e.TagId });

            entity.HasOne(e => e.Recipe)
                  .WithMany(r => r.RecipeTags)
                  .HasForeignKey(e => e.RecipeId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Tag)
                  .WithMany(t => t.RecipeTags)
                  .HasForeignKey(e => e.TagId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Collection configuration
        modelBuilder.Entity<Collection>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.ImageStorageKey).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Collections)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // CollectionRecipe configuration
        modelBuilder.Entity<CollectionRecipe>(entity =>
        {
            entity.HasKey(e => new { e.CollectionId, e.RecipeId });
            entity.Property(e => e.AddedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.Collection)
                  .WithMany(c => c.CollectionRecipes)
                  .HasForeignKey(e => e.CollectionId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Recipe)
                  .WithMany(r => r.CollectionRecipes)
                  .HasForeignKey(e => e.RecipeId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Seed predefined categories
        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Breakfast", Color = "#FCD34D" },
            new Category { Id = 2, Name = "Lunch", Color = "#34D399" },
            new Category { Id = 3, Name = "Dinner", Color = "#F87171" },
            new Category { Id = 4, Name = "Dessert", Color = "#F472B6" },
            new Category { Id = 5, Name = "Snacks", Color = "#A78BFA" },
            new Category { Id = 6, Name = "Beverages", Color = "#60A5FA" },
            new Category { Id = 7, Name = "Appetizers", Color = "#FB923C" }
        );

        // Seed predefined tags
        modelBuilder.Entity<Tag>().HasData(
            // Dietary tags
            new Tag { Id = 1, Name = "Vegetarian", Color = "#10B981", Type = TagType.Dietary },
            new Tag { Id = 2, Name = "Vegan", Color = "#059669", Type = TagType.Dietary },
            new Tag { Id = 3, Name = "Gluten-Free", Color = "#F59E0B", Type = TagType.Dietary },
            new Tag { Id = 4, Name = "Dairy-Free", Color = "#8B5CF6", Type = TagType.Dietary },
            new Tag { Id = 5, Name = "Keto", Color = "#EF4444", Type = TagType.Dietary },
            new Tag { Id = 6, Name = "Paleo", Color = "#EC4899", Type = TagType.Dietary },
            // Prep time tags
            new Tag { Id = 7, Name = "Quick (<30 min)", Color = "#3B82F6", Type = TagType.PrepTime },
            new Tag { Id = 8, Name = "Medium (30-60 min)", Color = "#6366F1", Type = TagType.PrepTime },
            new Tag { Id = 9, Name = "Long (>60 min)", Color = "#8B5CF6", Type = TagType.PrepTime },
            // Cuisine tags
            new Tag { Id = 10, Name = "Italian", Color = "#10B981", Type = TagType.Cuisine },
            new Tag { Id = 11, Name = "Mexican", Color = "#F59E0B", Type = TagType.Cuisine },
            new Tag { Id = 12, Name = "Asian", Color = "#EF4444", Type = TagType.Cuisine },
            new Tag { Id = 13, Name = "American", Color = "#3B82F6", Type = TagType.Cuisine },
            new Tag { Id = 14, Name = "Mediterranean", Color = "#06B6D4", Type = TagType.Cuisine },
            new Tag { Id = 15, Name = "Indian", Color = "#F97316", Type = TagType.Cuisine }
        );
    }
}
