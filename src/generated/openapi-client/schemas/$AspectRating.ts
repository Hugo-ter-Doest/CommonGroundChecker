/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $AspectRating = {
    properties: {
        rating: {
            type: 'Rating',
            isRequired: true,
        },
        found: {
            type: 'number',
            description: `For a document-count aspect: the inputs that pass`,
        },
        expected: {
            type: 'number',
            description: `For a document-count aspect: the inputs that were measured`,
        },
    },
} as const;
