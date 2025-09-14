# Social Media Feed Algorithm

This document describes the implementation of the dynamic, engaging feed algorithm for Zenusssss.

## Overview

The feed algorithm transforms user posts into a personalized experience by prioritizing content based on multiple factors:

1. **Engagement Metrics**: Posts with higher likes and comments receive higher priority
2. **Recency**: Newer posts are given preference over older ones
3. **User Relationships**: Content from users that the current user follows is prioritized
4. **Saved Posts**: Saved posts that haven't been shown recently are integrated into the feed

## Algorithm Components

### 1. Feed Prioritization

The core algorithm is implemented in `lib/feed-algorithm.ts` and uses a weighted scoring system:

- **Recency Score (40%)**: Newer posts receive higher scores
- **Engagement Score (30%)**: Posts with more likes and comments score higher
- **Relationship Score (20%)**: Posts from followed users receive higher scores
- **Saved Post Score (10%)**: Saved posts that haven't been shown recently score higher

### 2. User Preference Tracking

The system tracks user behavior to personalize the feed:

- **Interaction History**: Views, likes, comments, saves, and shares
- **Topic Preferences**: Inferred from post interactions
- **Behavior Metrics**: Session duration, active times, content format preferences

### 3. Saved Posts Integration

Saved posts are integrated into the feed based on:

- Whether they've been shown in the feed before
- How long it's been since they were last shown

## Implementation Details

### Models

- **SavedPost**: Tracks saved posts and their display status
- **UserPreference**: Stores user behavior and preferences

### Services

- **User Preference Service**: Updates preferences based on interactions
- **Session Tracker**: Monitors user session metrics

### Components

- **Post Item**: Tracks interactions with posts
- **Saved Posts Page**: Dedicated page for viewing saved posts

## Usage

The algorithm is automatically applied to the home feed. No user configuration is required.

## Future Enhancements

1. **Content Discovery**: Further refinement of discovery mechanisms
2. **A/B Testing**: Testing different algorithm weights
3. **Topic Classification**: Automatic classification of post topics
4. **Personalization Controls**: User-facing controls for feed customization