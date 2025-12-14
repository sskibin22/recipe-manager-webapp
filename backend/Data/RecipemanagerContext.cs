using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Models;

namespace RecipeManager.Api.Data;

public partial class RecipemanagerContext : DbContext
{
    public RecipemanagerContext()
    {
    }

    public RecipemanagerContext(DbContextOptions<RecipemanagerContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Favorite> Favorites { get; set; }

    public virtual DbSet<Recipe> Recipes { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlite("Data Source=recipemanager.db");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Favorite>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.RecipeId });

            entity.HasIndex(e => e.RecipeId, "IX_Favorites_RecipeId");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.Recipe).WithMany(p => p.Favorites).HasForeignKey(d => d.RecipeId);

            entity.HasOne(d => d.User).WithMany(p => p.Favorites).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<Recipe>(entity =>
        {
            entity.HasIndex(e => e.Title, "IX_Recipes_Title");

            entity.HasIndex(e => e.UserId, "IX_Recipes_UserId");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.User).WithMany(p => p.Recipes).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.AuthSub, "IX_Users_AuthSub").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
