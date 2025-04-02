import { describe, it, expect } from 'vitest';
import {
    AccountSchema,
    CreateAccountSchema,
    UpdateAccountSchema,
    GenderSchema,
    RoleSchema,
    WorkSettingSchema,
    UtilizationTypeSchema,
    ActivitySchema,
    DeviceSchema,
    DeviceTypeSchema,
    PhoneSchema
} from '@/interfaces/account.type.js';

import { mockDevice, mockAccount, mockCreateAccountWrongTypes, mockCreateAccountNoDevices, mockCreateAccountMinimum } from './account.mock.js';

describe('Account Type Schemas', () => {
    describe('DeviceSchema', () => {
        it('should validate a valid device', () => {
            expect(() => DeviceSchema.parse(mockDevice)).not.toThrow();
        });

        it('should allow null name', () => {
            const deviceWithNullName = {
                ...mockDevice,
                name: null,
            };
            expect(() => DeviceSchema.parse(deviceWithNullName)).not.toThrow();
        });

        it('should fail with invalid device type', () => {
            const invalidDevice = {
                ...mockDevice,
                type: 'windows' // invalid type
            };
            expect(() => DeviceSchema.parse(invalidDevice)).toThrow();
        });
    });

    describe('AccountSchema', () => {
        it('should validate a valid account', () => {
            expect(() => AccountSchema.parse(mockAccount)).not.toThrow();
        });

        it('should fail with invalid email format', () => {
            const invalidAccount = {
                ...mockAccount,
                email: 'invalid-email'
            };
            expect(() => AccountSchema.parse(invalidAccount)).toThrow();
        });

        it('should fail with invalid phone format', () => {
            const invalidAccount = {
                ...mockAccount,
                phone: 'not-a-phone'
            };
            expect(() => AccountSchema.parse(invalidAccount)).toThrow();
        });

        it('should require at least one device', () => {
            const invalidAccount = {
                ...mockAccount,
                devices: []
            };
            expect(() => AccountSchema.parse(invalidAccount)).toThrow();
        });
    });

    describe('CreateAccountSchema', () => {
        it('should not allow _id, created_at, updated_at fields', () => {
            const parsed = CreateAccountSchema.safeParse(mockCreateAccountWrongTypes);
            expect(parsed.success).toBe(false);
        });

        it('should not allow devices to be empty', () => {
            const parsed = CreateAccountSchema.safeParse(mockCreateAccountNoDevices);
            expect(parsed.success).toBe(false);
        });

        it('it should allow minimum fields', () => {
            const parsed = CreateAccountSchema.safeParse(mockCreateAccountMinimum);
            expect(parsed.success).toBe(true);
        });
    });

    describe('UpdateAccountSchema', () => {
        it('should not allow _id, created_at, updated_at fields', () => {
            const parsed = UpdateAccountSchema.safeParse(mockCreateAccountWrongTypes);
            expect(parsed.success).toBe(false);
        });

        it('should not allow devices to be empty', () => {
            const parsed = UpdateAccountSchema.safeParse(mockCreateAccountNoDevices);
            expect(parsed.success).toBe(false);
        });

        it('it should allow minimum fields', () => {
            const parsed = UpdateAccountSchema.safeParse(mockCreateAccountMinimum);
            expect(parsed.success).toBe(true);
        });
    });

    describe('Enum Schemas', () => {
        it('should validate valid gender values', () => {
            expect(() => GenderSchema.parse('male')).not.toThrow();
            expect(() => GenderSchema.parse('female')).not.toThrow();
            expect(() => GenderSchema.parse('other')).toThrow();
        });

        it('should validate valid role values', () => {
            for (const role of Object.values(RoleSchema.enum)) {
                expect(() => RoleSchema.parse(role)).not.toThrow();
            }

            expect(() => RoleSchema.parse('unknown')).toThrow();
        });

        it('should validate valid work setting values', () => {
            for (const workSetting of Object.values(WorkSettingSchema.enum)) {
                expect(() => WorkSettingSchema.parse(workSetting)).not.toThrow();
            }

            expect(() => WorkSettingSchema.parse('unknown')).toThrow();
        });

        it('should validate valid utilization type values', () => {
            for (const utilization of Object.values(UtilizationTypeSchema.enum)) {
                expect(() => UtilizationTypeSchema.parse(utilization)).not.toThrow();
            }

            expect(() => UtilizationTypeSchema.parse('unknown')).toThrow();
        });

        it('should validate valid activity values', () => {
            for (const activity of Object.values(ActivitySchema.enum)) {
                expect(() => ActivitySchema.parse(activity)).not.toThrow();
            }

            expect(() => ActivitySchema.parse('unknown')).toThrow();
        });

        it('should validate valid device type values', () => {
            for (const type of Object.values(DeviceTypeSchema.enum)) {
                expect(() => DeviceTypeSchema.parse(type)).not.toThrow();
            }
            expect(() => DeviceTypeSchema.parse('unknown')).toThrow();
        });
    });

    describe('Account Parser functions', () => {
        describe('Phone Parser', () => {
            const testNumbers = [
                { number: "+14155552671", valid: true }, // valid
                { number: "+442071838750", valid: true }, // valid
                { number: "123456", valid: false }, // invalid (does not start with "+")
                { number: "+1a34567890", valid: false }, // invalid (contains letters)
                { number: "+1123456789012345", valid: false }, // invalid (more than 15 digits)
            ];

            for (const number of testNumbers) {
                if (number.valid) {
                    it(`should parse a valid phone: ${number.number}`, () => {
                        const parsed = PhoneSchema.parse(number.number);
                        expect(parsed).toEqual(number.number);
                    });
                } else {
                    it(`should throw an error if the phone is invalid: ${number.number}`, () => {
                        expect(() => PhoneSchema.parse(number.number)).toThrow();
                    });
                }
            }
        });
    });
});