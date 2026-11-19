/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Rating } from './Rating';
export type AspectRating = {
    rating: Rating;
    /**
     * For a document-count aspect: the inputs that pass
     */
    found?: number;
    /**
     * For a document-count aspect: the inputs that were measured
     */
    expected?: number;
};

