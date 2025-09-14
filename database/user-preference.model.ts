import mongoose from "mongoose";

const UserPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Content interaction preferences
    interactionHistory: [
      {
        postId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
        },
        interactionType: {
          type: String,
          enum: ["view", "like", "comment", "save", "share"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Topic preferences based on post interactions
    topicPreferences: {
      type: Map,
      of: Number, // Score for each topic (higher = more interested)
      default: {},
    },
    // User behavior metrics
    behaviorMetrics: {
      averageSessionDuration: {
        type: Number,
        default: 0,
      },
      dailyActiveTime: {
        type: Number,
        default: 0,
      },
      lastActive: {
        type: Date,
        default: Date.now,
      },
      // Time of day preferences (when user is most active)
      activeTimePreferences: {
        morning: { type: Number, default: 0 },    // 5am-12pm
        afternoon: { type: Number, default: 0 },  // 12pm-5pm
        evening: { type: Number, default: 0 },    // 5pm-10pm
        night: { type: Number, default: 0 },      // 10pm-5am
      },
    },
    // Content format preferences
    contentFormatPreferences: {
      textOnly: { type: Number, default: 0 },
      withLinks: { type: Number, default: 0 },
      withMedia: { type: Number, default: 0 },
    },
    // Last time the preferences were updated
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create compound index for efficient queries
UserPreferenceSchema.index({ user: 1, "interactionHistory.timestamp": -1 });

// Create index for topic preferences
UserPreferenceSchema.index({ "topicPreferences": 1 });

const UserPreference = mongoose.models.UserPreference || mongoose.model("UserPreference", UserPreferenceSchema);

export default UserPreference;