import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { vi, describe, it, expect } from 'vitest';

// Use global setTimeout from vitest environment
const { setTimeout } = globalThis;

// Mock redux-thunk
const thunk = (store: any) => (next: any) => (action: any) => {
    if (typeof action === 'function') {
        return action(store.dispatch, store.getState);
    }
    return next(action);
};

// Mock all Taro components
vi.mock('@tarojs/components', () => ({
    View: ({ children, ...props }: any) => React.createElement('div', props, children),
    Text: ({ children, ...props }: any) => React.createElement('span', props, children),
    Image: ({ ...props }: any) => React.createElement('img', props),
    Button: ({ children, ...props }: any) => React.createElement('button', props, children),
    Progress: ({ ...props }: any) => React.createElement('div', { ...props, 'data-testid': 'progress' }),
}));

// Mock Taro APIs
vi.mock('@tarojs/taro', () => ({
    useRouter: () => ({
        params: { pathId: 'test-path-1' },
    }),
    navigateBack: vi.fn(),
}));

// Mock Redux actions
vi.mock('../../src/redux/actions/growthActions', () => ({
    default: {
        fetchGrowthPath: () => (dispatch: any) => {
            // Simulate successful fetch
            dispatch({ type: 'FETCH_GROWTH_PATH_SUCCESS' });
            return Promise.resolve();
        },
        updateGrowthProgress: (progress: number) => ({ type: 'UPDATE_GROWTH_PROGRESS', payload: progress }),
    },
}));

// Mock dependent components
vi.mock('../../src/components/Charts/LearningProgressChart', () => ({
    default: () => React.createElement('div', { 'data-testid': 'learning-progress-chart' }, 'Learning Progress Chart'),
}));

vi.mock('../../src/components/ThemeToggle', () => ({
    default: () =>
        React.createElement(
            'button',
            {
                'data-testid': 'theme-toggle',
                onClick: () => {},
            },
            'Theme Toggle',
        ),
}));

// Mock CSS modules
vi.mock('../../src/pages/growth/pathDetail.module.scss', () => ({
    default: {
        container: 'container',
        header: 'header',
        loadingContainer: 'loadingContainer',
        errorContainer: 'errorContainer',
        headerContent: 'headerContent',
        pathTitle: 'pathTitle',
        pathDescription: 'pathDescription',
        progressBar: 'progressBar',
        progressText: 'progressText',
        modulesContainer: 'modulesContainer',
        sectionTitle: 'sectionTitle',
        modulesList: 'modulesList',
        moduleCard: 'moduleCard',
        activeModule: 'activeModule',
        moduleTitle: 'moduleTitle',
        moduleProgress: 'moduleProgress',
        moduleProgressText: 'moduleProgressText',
        activeModuleDetail: 'activeModuleDetail',
        detailTitle: 'detailTitle',
        detailDescription: 'detailDescription',
        challengesTitle: 'challengesTitle',
        challengesList: 'challengesList',
        challengeItem: 'challengeItem',
        completedChallenge: 'completedChallenge',
        challengeHeader: 'challengeHeader',
        challengeName: 'challengeName',
        difficultyBadge: 'difficultyBadge',
        easy: 'easy',
        medium: 'medium',
        hard: 'hard',
    },
}));

// Import the component after mocks
import PathDetail from '../../src/pages/growth/pathDetail';

// Mock Redux store with proper initial state
const initialState = {
    pathDetail: {
        id: 'test-path-1',
        name: 'Test Learning Path',
        description: 'A test learning path for unit testing',
        progress: 50,
        modules: [
            {
                id: 'module-1',
                name: 'Module 1',
                description: 'First module',
                progress: 75,
                isCompleted: false,
                challenges: [
                    {
                        id: 'challenge-1',
                        name: 'Challenge 1',
                        difficulty: 'easy' as const,
                        isCompleted: false,
                    },
                ],
            },
        ],
    },
    skillsData: [
        { name: 'JavaScript', value: 80, category: 'Programming' },
        { name: 'React', value: 70, category: 'Frontend' },
    ],
    progressData: [
        { date: '2024-01-01', progress: 30 },
        { date: '2024-01-02', progress: 50 },
    ],
};

const growthReducer = (state = initialState, action: any) => {
    switch (action.type) {
        case 'FETCH_GROWTH_PATH_SUCCESS':
            return state;
        case 'UPDATE_GROWTH_PROGRESS':
            return {
                ...state,
                pathDetail: {
                    ...state.pathDetail,
                    progress: action.payload,
                },
            };
        default:
            return state;
    }
};

const store = createStore(combineReducers({ growth: growthReducer }), applyMiddleware(thunk));

const renderWithProvider = (component: React.ReactElement) => {
    return render(<Provider store={store}>{component}</Provider>);
};

describe('PathDetail', () => {
    it('should render loading state initially', () => {
        renderWithProvider(<PathDetail pathId="test-path-1" />);
        expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('should render path detail after loading', async () => {
        renderWithProvider(<PathDetail pathId="test-path-1" />);

        // Wait for the component to finish loading
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(screen.getByText('Test Learning Path')).toBeInTheDocument();
    });

    it('should display path information', async () => {
        renderWithProvider(<PathDetail pathId="test-path-1" />);

        // Wait for the component to finish loading
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(screen.getByText('A test learning path for unit testing')).toBeInTheDocument();
    });
});
