# Project Architecture: KAIRO (AI Career Mentor)

KAIRO is a structured career mentorship platform that combines AI-driven guidance with a rigorous, sequential curriculum system.

## Architectural Overview

```mermaid
graph TD
    %% Define styles
    classDef frontend fill:#6366F1,stroke:#333,stroke-width:1px,color:#fff;
    classDef backend fill:#10B981,stroke:#333,stroke-width:1px,color:#fff;
    classDef storage fill:#F59E0B,stroke:#333,stroke-width:1px,color:#fff;
    classDef ai fill:#EC4899,stroke:#333,stroke-width:1px,color:#fff;

    %% ── Frontend Domain (React + Vite) ──
    subgraph Frontend [Frontend Interface]
        direction TB
        Dash[Dashboard.jsx\nWeekly Roadmap]
        Learn[VideoConsole.jsx\nSequential Learning]
        Ctx((AppContext)):::frontend
        
        subgraph InteractionLogic [Access Control]
            DayLock[Day Lock Logic\nDepends on N-1]
            VidLock[Video Lock Logic\nSequential]
        end
    end

    %% ── Backend Domain (Flask) ──
    subgraph Backend [Backend API Layer]
        AppPy[app.py\nAPI Gateway]
        
        subgraph Routes [Service Modules]
            RT_Task[task_routes.py\nRoadmap & Plan]
            RT_Prog[progress_routes.py\nUser Tracking]
            RT_Ment[mentor_routes.py\nAI Interaction]
        end

        subgraph Logic [Core Engines]
            LS_Cur[task_logic.py\nCurriculum Engine]
            LS_Store[storage_logic.py\nState Engine]
            LS_AI[ai_helper.py\nAI Feedback]
        end
    end

    %% ── Data & Intelligence ──
    subgraph Persistence [Data Layer]
        KB_Task[tasks.json\nMaster Curriculum]:::storage
        KB_User[user_*.json\nProgress Storage]:::storage
        LLM[Gemini 2.0\nAI Mentor]:::ai
    end

    %% ── Flow ──
    Dash -- Request Week Plan --> RT_Task
    RT_Task -- Fetch & Compute Locks --> LS_Cur
    LS_Cur -- Read Curriculum --> KB_Task
    LS_Cur -- Check Progress --> LS_Store
    LS_Store -- Read/Write State --> KB_User

    Learn -- Mark Complete --> RT_Prog
    RT_Prog -- Update Status --> LS_Store

    RT_Ment -- Generate Strategy --> LS_AI
    LS_AI -- Consult Knowledge --> LLM

    %% Highlighting
    class Frontend,Dash,Learn frontend;
    class Backend,AppPy,RT_Task,RT_Prog,RT_Ment,LS_Cur,LS_Store,LS_AI backend;
    class Persistence,KB_Task,KB_User storage;
    class LLM ai;
```

## Core Systems

### 1. Hierarchical Locking (Curriculum Guard)
*   **Day Lock**: Unlocking Day $N$ requires all videos and assignments in Day $N-1$ to be complete.
*   **Video Lock**: Within an unlocked day, each video is gated by the completion of the previous one.

### 2. Unified State Management
*   Progress is tracked at the **video level** and **day level** within `user_id.json`.
*   Assignments act as "gates" for day completion.

### 3. Performance Optimization
*   The backend implements a **warmed cache** for `tasks.json` (5000+ lines) to ensure sub-100ms response times for weekly navigation.
