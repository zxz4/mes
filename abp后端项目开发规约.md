# 后端项目开发规约（参考）

以下以Sporadic.Identity项目为示例

## 1. 项目结构规范

```bash
Sporadic.Identity/
├── src/
│   ├── Sporadic.Identity.Application/ # 依赖Contracts和Domain项目
│   │   └── Sporadic/Identity/
│   │       └── Users/  # 用户管理模块（应用层）
│   │           └── UserAppService.cs # 应用实现服务
│   │
│   ├── Sporadic.Identity.Application.Contracts/ #依赖Domain.Shared项目
│   │   └── Sporadic/Identity/
│   │       └──Users/                   # 用户管理模块（接口/契约层）
│   │          ├── IUserAppService.cs   # 服务接口
│   │          ├── UserDto.cs           # 传输对象
│   │          └── CreateUserDto.cs     # 传输对象
│   │
│   ├── Sporadic.Identity.HttpApiHost/ #依赖Application、EntityFrameworkCore、HttpApi项目
│   │
│   ├── Sporadic.Identity.Domain.Shared/ # 用于存放错误代码，实体属性约束常量，枚举等
│   │
│   ├── Sporadic.Identity.Domain/ # 实体领域层，存放实体，实体数据管理和相关仓储
│   │   └──Sporadic/Identity/ 
│   │       ├─IdentityDbProperties.cs # 配置数据库连接和表配置
│   │       └─Users/                  # 用户管理模块（领域层）
│   │         └─ User.cs              # 用户实体
│   │         └─ IUserRepository.cs   # 用户仓储接口
│   │         └─ UserDomainService.cs # 用户领域服务用于处理关键数据更改，发布/处理领域事件
│   │
│   ├── Sporadic.Identity.EntityFrameworkCore/ # 依赖Domain项目
│   │   └── Sporadic/Identity/EntityFrameworkCore/
│   │       ├── Users/                       # 用户管理模块（数据访问层）
│   │       │   └── EfCoreUserRepository.cs  # 数据访问层实现
│   │       │
│   │       ├── IIdentityDbContext # DbContext接口 
│   │       ├── IdentityDbContext  # DbContext的Ef实现版本
│   │       └── IdentityDbContextModelBuilderExtensions.cs  # 配置数据库的静态方法
│   │
│   └── Sporadic.Identity.HttpApi/ # 服务API接口层，要求全部公开类，方法，属性都有注释
│       └── Controllers/
│           └──IdentityControllerBase.cs  # 用户管理模块控制器基类
│           └──Users/                     # 用户管理模块（API层）
│              └── UserController.cs      # 用户API控制器
│
└── Sporadic.Identity.sln # 解决方案文件
```

项目间依赖必须遵守

- Domain.Shared ← Domain
- Domain ← EntityFrameworkCore
- Application ← Application.Contracts ← Domain.Shared
- HttpApi ← Application.Contracts
- {EntityFrameworkCore,HttpApi,Application} ← HttpApiHost

禁止反向或循环依赖。

## 2. 命名规范

### 2.1 命名空间

- 按照[机构/个人].[服务].[模块]方式命名
- 模块文件夹和命名空间：复数形式
  - 用户管理模块（示例）：`Sporadic.Identity.Users`
  - 角色管理模块（示例）：`Sporadic.Identity.Roles`

### 2.2 类型命名

| 类型             | 命名规范                  | 示例                     |
|------------------|---------------------------|--------------------------|
| 模块文件夹        | 复数形式                  | `Users/`                  |
| 命名空间          | 复数形式                  | `Sporadic.Identity.Users`|
| 服务接口          | `I[模块单数]AppService`   | `IUserAppService`        |
| 服务实现          | `[模块单数]AppService`    | `UserAppService`         |
| 仓储实现          | `[ORM][模块]Repository`  | `EfCoreUserRepository`    |
| 领域实体          | 单数形式                  | `User.cs`,`IUserRepository`|
| DTO类            | 单数形式                  | `UserDto.cs`             |
| 控制器            | 模块单数 + Controller     | `UserController.cs`      |

## 3. 模块化开发规范

### 应用服务契约

```csharp
// 用户管理模块 - 应用服务接口
// 存放路径 src/Sporadic.Identity.Application.Contracts/Users
namespace Sporadic.Identity.Users
{
    /// <summary>
    /// 用户应用服务接口，继承abpvnext框架IApplicationService实现自动注入
    /// </summary>
    public interface IUserAppService : IApplicationService
    {
        /// <summary>
        /// 根据指定ID获取用户
        /// </summary>
        /// <param name="id">User ID.</param>
        /// <returns>User DTO</returns>
        /// <response code="200">Returns the user.</response>
        /// <response code="404">If user not found.</response>
        Task<UserDto> GetUserAsync(Guid id);
    }
}

// 用户管理模块 - 数据传输对象（接口层） 
// 存放路径 src/Sporadic.Identity.Application.Contracts/Users
namespace Sporadic.Identity.Users
{
    /// <summary>
    /// 创建用户所需数据传输对象
    /// </summary>
    public class CreateUserDto
    {
        /// <summary>
        /// 用户名（必须唯一）
        /// </summary>
        [Required]
        [StringLength(50)]
        public string UserName { get; set; }
    }
}
```

### 应用服务实现

```csharp

// 服务基类
// 存放路径 src/Sporadic.Identity.Application
namespace Sporadic.Identity
{
    // 继承 abpvnext框架的ApplicationService实现一些基本功能
    public abstract class IdentityAppServiceBase : ApplicationService 
    {
        protected IdentityAppServiceBase()
        {
            // 配置automapper上下文
            ObjectMapperContext = typeof(SporadicIdentityApplicationModule);
        }
    }
}

// 用户管理模块 - 应用服务接口实现，
// src/Sporadic.Identity.Application/Users
namespace Sporadic.Identity.Users
{
    // 继承 IdentityAppServiceBase 和 IUserAppService
    public class UserAppService : IdentityAppServiceBase , IUserAppService
    {
        public Task<UserDto> GetUserAsync(Guid id){ }
    }
}
```

### 用户API控制器

```csharp
// 模块控制器基类 - 应用服务接口控制器层
// 存放路径 src/Sporadic.Identity.HttpApi/
namespace Sporadic.Identity.Users
{
    /// <summary>
    /// 用户API接口基类，继承abpvnext框架AbpControllerBase
    /// </summary>
    public abstract class IdentityControllerBase : AbpControllerBase
    {
    }
}

// 用户api控制器模块 - 应用服务接口控制器层
// 和契约层传输对象一致需要必要注释，以便swagger或OPENAPI生成动态文档
// 存放路径 src/Sporadic.Identity.HttpApi/Users/
namespace Sporadic.Identity.Users
{
    /// <summary>
    /// 用户API接口基类，继承模块控制器基类和应用服务IUserAppService
    /// 这里是手动实现的控制器，亦可以通过ABP的AutoApi机制实现
    /// </summary>
    [RemoteService(Name = IdentityRemoteServiceConsts.RemoteServiceName)]
    [ControllerName("User")]
    [Route("api/identity/users")]
    public class IdentityUserController :IdentityControllerBase 
    {
        /// <summary>
        /// 获取指定用户信息
        /// </summary>
        /// <param name="id">用户唯一标识</param>
        /// <returns>用户详细信息</returns>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(Guid id)
        {
            // 实现代码
        }
    }
}


```

### 领域实体

```csharp

// 数据库相关配置信息
// 对应路径 /src/Sporadic.Identity.Domain/
namespace Sporadic.Identity
{
    /// <summary>
    /// 数据库连接和表配置
    /// </summary>
    public class SporadicIdentityDbProperties
    {
        /// <summary>
        /// 表前缀
        /// </summary>
        public static string DbTablePrefix { get; set; } = "ids_";

        /// <summary>
        /// 表模式
        /// </summary>
        public static string DbSchema { get; set; } = null;

        /// <summary>
        /// 连接字符串名称
        /// </summary>
        public const string ConnectionStringName = "Identity";
    }
}



// 用户管理模块 - 领域实体和对应仓储接口 放置在Sporadic.Identity.Domain项目中
// 对应路径 src/Sporadic.Identity.Domain/Users
// 尽量不要使用贫血模型，项目一般采用DDD领域驱动设计
namespace Sporadic.Identity.Users
{
    /// <summary>
    /// 用户领域实体（聚合根）可能会发布些领域事件，非聚合根可以直接继承Entity<TYPE>
    /// </summary>
    public class User : AggregateRoot<Guid>
    {
         public string UserName { get; private set; }
         
         protected internal User() { }  // for ORM 
         public User(Guid id, string userName) : base(id)
         {
             SetUserName(userName);
             // AddLocalEvent(new UserCreatedEvent(this));
         }
         public void SetUserName(string userName) { ... }
}
}

// 用户实体仓储
// 对应路径 src/Sporadic.Identity.Domain/Users
namespace Sporadic.Identity.Users
{
    /// <summary>
    /// 用户仓储接口
    /// </summary>
    public interface IUserRepository : IRepository<User, Guid>  // IRepository abp vnext标准仓储接口，定义了譬如CRUD的一系列基础功能
    {
 
        /// <summary>
        /// 根据用户名获取用户信息
        /// </summary>
        /// <param name="serialNumber">用户名</param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        public Task<User> GetByUserNameAsync(string userName, CancellationToken cancellationToken = default));
    }
}

```

### 实体访问层 （仓储实现，示例是使用的ef core）

```csharp
// 用户管理模块 - 领域实体和对应仓储接口 放置在Sporadic.Identity.EntityFrameworkCore项目中
// 对应路径 src/Sporadic.Identity.EntityFrameworkCore/Users/
namespace Sporadic.Identity.EntityFrameworkCore.Users
{
    /// <summary>
    /// 用户仓储实现 ，EfCoreRepository 是abp vnext的默认仓储实现
    /// </summary>
    public class EfCoreUserRepository : EfCoreRepository<IdentityDbContext,User,Guid> , IUserRepository
    {
        /// 对应接口的实现
    }
}

// 模块DbContext接口
// 路径 src/Sporadic.Identity.EntityFrameworkCore/Users/
namespace Sporadic.Identity.EntityFrameworkCore
{
    /// <summary>
    /// 模块数据库上下文抽象层
    /// </summary>
    public interface IIdentityDbContext : IEfCoreDbContext
    {
        // 定义模块的各种实体

        DbSet<User> Users {get;}
    }
}

// 模块DbContext具体实现
// 路径为 src/Sporadic.Identity.EntityFrameworkCore/
namespace Sporadic.Identity.EntityFrameworkCore
{
    /// <summary>
    /// 模块数据库上下文具体实现
    /// </summary>
    public interface IdentityDbContext : EfCoreDbContext
    {
        public DbSet<User> Users {get; set;}

        protected override void OnModelCreating(ModelBuilder builder)
        {
            //一般会定义一个辅助方法用来配置数据库（code first）
        }
    }
}

// 实体的数据库相关配置，一般使用code first模式，用于ef core工具生成迁移记录
// 路径为 src/Sporadic.Identity.EntityFrameworkCore/
namespace Sporadic.Identity.EntityFrameworkCore
{
    /// <summary>
    /// 数据库辅助配置名称格式为[模块名/单数]+DbContextModelCreatingExtensions
    /// </summary>
    public static class IdentityDbContextModelCreatingExtensions
    {
        //定义静态方法配置数据库，名称格式一般为Configure+[模块名称]
        public static void ConfigureIdentity(this ModelBuilder builder)
        {
            //配置实体信息
            builder.Entity<User>(b =>{
                // 表名使用蛇形
                b.ToTable(IdentityDbProperties.DbTablePrefix + "users");
                // 列名一般使用属性名，对于部分数据库有要求的可以按需更改
                b.Property(u => u.UserName)
                .HasColumnName(nameof(User.UserName)); // 使用默认可以忽略该写法

            })

        }

    }
}
```

## 4. 文档注释规范

类或方法名称不足以体现功能以及逻辑复杂部分，包括全部接口及接口定义的方法都应有注释，注释应保持简洁明确，使用完整的句子和正确的语法，参数和返回值需详细说明。对于API方法，应包含HTTP状态码说明。
