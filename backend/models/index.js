const { Sequelize, DataTypes, Op } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database connection
// Detect dialect from DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;
let sequelize;

if (databaseUrl && databaseUrl.startsWith('sqlite:')) {
    // SQLite configuration
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: databaseUrl.replace('sqlite:', ''),
        logging: false
    });
} else if (databaseUrl && databaseUrl.startsWith('postgresql:')) {
    // PostgreSQL configuration
    sequelize = new Sequelize(databaseUrl, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: process.env.NODE_ENV === 'production' ? {
                require: true,
                rejectUnauthorized: false
            } : false
        },
        logging: false
    });
} else {
    // Fallback to individual fields
    sequelize = new Sequelize({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        dialect: 'postgres',
        dialectOptions: {
            ssl: process.env.NODE_ENV === 'production' ? {
                require: true,
                rejectUnauthorized: false
            } : false
        },
        logging: false
    });
}

// Test connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully.');
    } catch (error) {
        console.error('❌ Unable to connect to database:', error.message);
    }
};

// Guest Model
const Guest = sequelize.define('Guest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: true }
    },
    lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: true }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    attendance: {
        type: DataTypes.ENUM('yes', 'no', 'pending'),
        defaultValue: 'pending',
        allowNull: false
    },
    guestCount: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: { min: 0, max: 10 }
    },
    meal: {
        type: DataTypes.ENUM('beef', 'chicken', 'fish', 'vegetarian', 'vegan', ''),
        defaultValue: ''
    },
    table: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    dietary: {
        type: DataTypes.JSON,
        defaultValue: [],
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    rsvpDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'guests',
    timestamps: true,
    indexes: [
        { fields: ['email'] },
        { fields: ['attendance'] },
        { fields: ['rsvpDate'] }
    ]
});

// Activity Log Model
const Activity = sequelize.define('Activity', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.ENUM('rsvp', 'update', 'delete', 'login', 'email', 'import'),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    guestId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'guests', key: 'id' }
    },
    adminId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'activities',
    timestamps: true
});

// Photo Gallery Model
const Photo = sequelize.define('Photo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    url: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    thumbnail: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    category: {
        type: DataTypes.ENUM('engagement', 'prewedding', 'couple', 'travel', 'wedding'),
        defaultValue: 'couple'
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    location: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    photoDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    width: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    height: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    likes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    uploadedBy: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
}, {
    tableName: 'photos',
    timestamps: true
});

// Admin User Model
const Admin = sequelize.define('Admin', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: { isEmail: true }
    },
    role: {
        type: DataTypes.ENUM('owner', 'admin', 'editor'),
        defaultValue: 'admin'
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'admins',
    timestamps: true
});

// Define relationships
Guest.hasMany(Activity, { foreignKey: 'guestId', as: 'activities' });
Activity.belongsTo(Guest, { foreignKey: 'guestId' });

// Export everything
module.exports = {
    sequelize,
    Op,
    Guest,
    Activity,
    Photo,
    Admin,
    testConnection
};