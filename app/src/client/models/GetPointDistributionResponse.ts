/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type GetPointDistributionResponse = {
    totalPoints: number;
    cutPoints: Array<number>;
    pointDistribution: Array<{
        placement: number;
        points: number;
        cumulative: number;
    }>;
};

