const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false
    }
);

// Guest Model
const Guest = sequelize.define('Guest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    phone: DataTypes.STRING,
    attendance: {
        type: DataTypes.ENUM('yes', 'no', 'pending'),
        defaultValue: 'pending'
    },
    guestCount: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    meal: {
        type: DataTypes.ENUM('beef', 'chicken', 'fish', 'vegetarian', 'vegan', ''),
        defaultValue: ''
    },
    table: DataTypes.STRING,
    dietary: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    notes: DataTypes.TEXT,
    rsvpDate: DataTypes.DATE,
    ipAddress: DataTypes.STRING,
    userAgent: DataTypes.TEXT
}, {
    tableName: 'guests',
    timestamps: true
});

// Activity Log Model
const Activity = sequelize.define('Activity', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.ENUM('rsvp', 'update', 'delete', 'login', 'email'),
        allowNull: false
    },
    description: DataTypes.TEXT,
    guestId: DataTypes.INTEGER,
    metadata: DataTypes.JSONB
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
        type: DataTypes.STRING,
        allowNull: false
    },
    thumbnail: DataTypes.STRING,
    category: {
        type: DataTypes.ENUM('engagement', 'prewedding', 'couple', 'travel', 'wedding'),
        defaultValue: 'couple'
    },
    title: DataTypes.STRING,
    location: DataTypes.STRING,
    photoDate: DataTypes.DATE,
    width: DataTypes.INTEGER,
    height: DataTypes.INTEGER,
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
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: DataTypes.STRING,
    lastLogin: DataTypes.DATE
}, {
    tableName: 'admins',
    timestamps: true
});

module.exports = {
    sequelize,
    Guest,
    Activity,
    Photo,
    Admin
};